"use client";

import { ArrowLeft, Paperclip, Search, Send } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  markConversationReadAction,
  sendMessageAction,
} from "@/app/actions/activity";
import { useLiveActivity } from "@/components/activity/live-activity-provider";
import { AvatarMark } from "@/components/shared/avatar-mark";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  listConversations,
  listMessages,
  mapMessage,
  type LiveConversation,
  type LiveMessage,
} from "@/lib/data/messages";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function shortTime(value: string) {
  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString("en", { month: "short", day: "numeric" });
}

function orderConversations(items: LiveConversation[]) {
  return [...items].sort((left, right) => {
    const leftTime = left.lastMessage?.createdAt ?? left.updatedAt;
    const rightTime = right.lastMessage?.createdAt ?? right.updatedAt;
    return rightTime.localeCompare(leftTime);
  });
}

function mergeMessages(current: LiveMessage[], incoming: LiveMessage[]) {
  const byId = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming) byId.set(message.id, message);
  return [...byId.values()].sort((left, right) =>
    left.createdAt === right.createdAt
      ? left.id.localeCompare(right.id)
      : left.createdAt.localeCompare(right.createdAt),
  );
}

export function LiveMessagesPage({
  currentUserId,
  initialConversations,
  initialActiveConversationId,
}: {
  currentUserId: string;
  initialConversations: LiveConversation[];
  initialActiveConversationId: string | null;
}) {
  const { messageRevision, refreshCounts } = useLiveActivity();
  const [conversations, setConversations] = useState(() => orderConversations(initialConversations));
  const [activeConversationId, setActiveConversationId] = useState(initialActiveConversationId);
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [loadingConversation, setLoadingConversation] = useState(Boolean(initialActiveConversationId));
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [sending, setSending] = useState(false);
  const requestId = useRef(0);
  const messageScrollAreaRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const shouldScroll = useRef(true);
  const lastActivityRevision = useRef(messageRevision);

  const activeConversation = conversations.find((item) => item.id === activeConversationId) ?? null;
  const filteredConversations = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return conversations;
    return conversations.filter((conversation) =>
      `${conversation.otherProfile.fullName} ${conversation.otherProfile.username} ${conversation.lastMessage?.body ?? ""}`
        .toLowerCase()
        .includes(normalized),
    );
  }, [conversations, query]);

  const refreshConversations = useCallback(async () => {
    try {
      setConversations(orderConversations(await listConversations(createClient())));
    } catch {
      toast.error("Could not refresh conversations.");
    }
  }, []);

  const acknowledge = useCallback(async (conversationId: string) => {
    setConversations((items) => items.map((item) =>
      item.id === conversationId ? { ...item, unreadCount: 0 } : item,
    ));
    const result = await markConversationReadAction({ conversationId });
    if (result.ok) await refreshCounts();
  }, [refreshCounts]);

  useEffect(() => {
    if (!shouldScroll.current) return;
    const area = messageScrollAreaRef.current;
    area?.scrollTo({ top: area.scrollHeight, behavior: "smooth" });
    shouldScroll.current = false;
  }, [messages]);

  useEffect(() => {
    if (lastActivityRevision.current === messageRevision) return;
    lastActivityRevision.current = messageRevision;
    void refreshConversations();
  }, [messageRevision, refreshConversations]);

  useEffect(() => {
    if (!activeConversationId) return;
    const currentRequest = ++requestId.current;
    const supabase = createClient();
    const channel = supabase
      .channel(`conversation:${activeConversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        (payload) => {
          const incoming = mapMessage(
            payload.new as Database["public"]["Tables"]["messages"]["Row"],
          );
          shouldScroll.current = true;
          setMessages((items) => mergeMessages(items, [incoming]));
          setConversations((items) => orderConversations(items.map((item) =>
            item.id === incoming.conversationId
              ? {
                  ...item,
                  lastMessage: {
                    id: incoming.id,
                    body: incoming.body,
                    senderId: incoming.senderId,
                    createdAt: incoming.createdAt,
                  },
                  unreadCount: incoming.recipientId === currentUserId ? 0 : item.unreadCount,
                }
              : item,
          )));
          if (incoming.recipientId === currentUserId) void acknowledge(activeConversationId);
        },
      )
      .subscribe();
    void listMessages(supabase, activeConversationId)
      .then((page) => {
        if (requestId.current !== currentRequest) return;
        shouldScroll.current = true;
        setMessages((items) => mergeMessages(items, page.items));
        setHasMore(page.hasMore);
        void acknowledge(activeConversationId);
      })
      .catch(() => toast.error("Could not load this conversation."))
      .finally(() => {
        if (requestId.current === currentRequest) setLoadingConversation(false);
      });
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [acknowledge, activeConversationId, currentUserId]);

  function selectConversation(conversationId: string) {
    if (conversationId === activeConversationId) return;
    setActiveConversationId(conversationId);
    setMessages([]);
    setHasMore(false);
    setLoadingConversation(true);
    window.history.replaceState(null, "", `/messages?conversation=${conversationId}`);
  }

  async function loadOlder() {
    const oldest = messages[0];
    if (!activeConversationId || !oldest || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const page = await listMessages(createClient(), activeConversationId, {
        before: oldest.createdAt,
      });
      shouldScroll.current = false;
      setMessages((items) => mergeMessages(page.items, items));
      setHasMore(page.hasMore);
    } catch {
      toast.error("Could not load older messages.");
    } finally {
      setLoadingOlder(false);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeConversationId || sending) return;
    const body = draft.trim();
    if (!body) return;
    if (body.length > 4000) {
      toast.error("Messages can be at most 4,000 characters.");
      return;
    }
    setSending(true);
    const result = await sendMessageAction({ conversationId: activeConversationId, body });
    setSending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setDraft("");
    shouldScroll.current = true;
    setMessages((items) => mergeMessages(items, [result.data]));
    setConversations((items) => orderConversations(items.map((item) =>
      item.id === activeConversationId
        ? {
            ...item,
            lastMessage: {
              id: result.data.id,
              body: result.data.body,
              senderId: result.data.senderId,
              createdAt: result.data.createdAt,
            },
          }
        : item,
    )));
  }

  return (
    <div className="page-container">
      <PageHeading
        eyebrow="Direct conversations"
        title="Messages"
        description="Private one-to-one messages with QAIRU members."
      />
      <div className="surface grid min-h-[620px] overflow-hidden rounded-lg md:grid-cols-[280px_1fr]">
        <aside className={activeConversationId ? "hidden border-e md:block" : "border-e"}>
          <div className="border-b p-3">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-9 ps-8"
                placeholder="Search conversations"
                aria-label="Search conversations"
              />
            </div>
          </div>
          {filteredConversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              onClick={() => selectConversation(conversation.id)}
              className={`flex w-full items-center gap-3 border-b p-3 text-start transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${activeConversationId === conversation.id ? "bg-accent" : ""}`}
              aria-current={activeConversationId === conversation.id ? "true" : undefined}
            >
              <AvatarMark initials={initials(conversation.otherProfile.fullName)} color="#4f5fc4" className="size-9" />
              <span className="min-w-0 flex-1">
                <span className="flex justify-between gap-2">
                  <span className="truncate text-xs font-semibold">{conversation.otherProfile.fullName}</span>
                  {conversation.lastMessage && <span className="shrink-0 text-[9px] text-muted-foreground">{shortTime(conversation.lastMessage.createdAt)}</span>}
                </span>
                <span className="mt-1 block truncate text-[11px] text-muted-foreground">
                  {conversation.lastMessage?.body ?? "Start a conversation"}
                </span>
              </span>
              {conversation.unreadCount > 0 && (
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary text-[10px] text-primary-foreground" aria-label={`${conversation.unreadCount} unread messages`}>
                  {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
                </span>
              )}
            </button>
          ))}
          {!filteredConversations.length && (
            <p className="p-8 text-center text-xs text-muted-foreground">
              {conversations.length ? "No conversations matched." : "Open a profile and choose Message to start a conversation."}
            </p>
          )}
        </aside>

        <section className={activeConversationId ? "flex min-h-[520px] flex-col" : "hidden min-h-[520px] flex-col md:flex"}>
          {activeConversation ? (
            <>
              <header className="flex h-16 items-center gap-3 border-b px-3 sm:px-5">
                <Button className="md:hidden" size="icon" variant="ghost" aria-label="Back to conversations" onClick={() => setActiveConversationId(null)}>
                  <ArrowLeft className="size-4" />
                </Button>
                <AvatarMark initials={initials(activeConversation.otherProfile.fullName)} color="#4f5fc4" className="size-9" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{activeConversation.otherProfile.fullName}</p>
                  <p className="truncate text-[11px] text-muted-foreground">Direct message / @{activeConversation.otherProfile.username}</p>
                </div>
              </header>
              <div ref={messageScrollAreaRef} className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 sm:p-5" aria-live="polite">
                {hasMore && (
                  <Button className="mx-auto mb-5" size="sm" variant="outline" onClick={() => void loadOlder()} disabled={loadingOlder}>
                    {loadingOlder ? "Loading..." : "Load older messages"}
                  </Button>
                )}
                <div className="mt-auto flex flex-col gap-3">
                  {loadingConversation && <p className="self-center text-xs text-muted-foreground">Loading messages...</p>}
                  {!loadingConversation && !messages.length && <p className="self-center py-10 text-sm text-muted-foreground">Send the first message.</p>}
                  {messages.map((message) => {
                    const own = message.senderId === currentUserId;
                    return (
                      <div key={message.id} className={`max-w-[85%] rounded-lg px-3.5 py-2.5 text-xs leading-5 sm:max-w-[75%] ${own ? "ms-auto bg-primary text-primary-foreground" : "bg-muted"}`}>
                        <p className="whitespace-pre-wrap break-words">{message.body}</p>
                        <p className="mt-1 text-[9px] opacity-60">{shortTime(message.createdAt)}</p>
                      </div>
                    );
                  })}
                  <div ref={endRef} />
                </div>
              </div>
              <form onSubmit={submit} className="flex gap-2 border-t p-3 sm:p-4">
                <Button type="button" size="icon" variant="ghost" aria-label="Attachments are not available" title="Attachments are not available yet" disabled>
                  <Paperclip className="size-4" />
                </Button>
                <Input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Write a message..."
                  autoComplete="off"
                  maxLength={4000}
                  aria-label="Message"
                />
                <Button size="icon" aria-label="Send message" disabled={sending || !draft.trim()}>
                  <Send className="size-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="grid flex-1 place-items-center p-8 text-center">
              <div>
                <p className="font-semibold">Choose a conversation</p>
                <p className="mt-2 text-sm text-muted-foreground">Your private message history will appear here.</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
