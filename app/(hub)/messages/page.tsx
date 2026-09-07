import { redirect } from "next/navigation";
import { Suspense } from "react";
import { MessagesPage } from "@/components/demo/messages-page";
import { LiveMessagesPage } from "@/components/messages/live-messages-page";
import { isLiveMode } from "@/lib/app-mode";
import { getCurrentAuth } from "@/lib/auth/current-user";
import { listConversations, listMessages } from "@/lib/data/messages";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ conversation?: string }>;
}) {
  if (!isLiveMode) {
    return <Suspense fallback={<div className="page-container">Loading conversations…</div>}><MessagesPage /></Suspense>;
  }
  const { supabase, userId } = await getCurrentAuth();
  if (!userId) redirect("/login");
  const conversations = await listConversations(supabase);
  const requested = (await searchParams).conversation;
  const activeConversationId = conversations.some((item) => item.id === requested)
    ? requested ?? null
    : conversations[0]?.id ?? null;
  const page = activeConversationId
    ? await listMessages(supabase, activeConversationId)
    : { items: [], hasMore: false };
  return (
    <LiveMessagesPage
      currentUserId={userId}
      initialConversations={conversations}
      initialActiveConversationId={activeConversationId}
      initialMessages={page.items}
      initialHasMore={page.hasMore}
    />
  );
}
