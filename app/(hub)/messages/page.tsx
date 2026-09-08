import { redirect } from "next/navigation";
import { Suspense } from "react";
import { MessagesPage } from "@/components/demo/messages-page";
import { LiveMessagesPage } from "@/components/messages/live-messages-page";
import { isLiveMode } from "@/lib/app-mode";
import { getCurrentAuth } from "@/lib/auth/current-user";
import { listConversations } from "@/lib/data/messages";
import { withServerTiming } from "@/lib/observability/server-timing";

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ conversation?: string }>;
}) {
  if (!isLiveMode) {
    return <Suspense fallback={<div className="page-container">Loading conversations…</div>}><MessagesPage /></Suspense>;
  }
  return <Suspense fallback={<div className="page-container"><div className="h-10 w-52 animate-pulse rounded bg-muted" /><div className="mt-8 h-[620px] animate-pulse rounded-lg bg-muted/60" /></div>}><MessageData searchParams={searchParams} /></Suspense>;
}

async function MessageData({
  searchParams,
}: {
  searchParams: Promise<{ conversation?: string }>;
}) {
  const { supabase, userId } = await getCurrentAuth();
  if (!userId) redirect("/login");
  const conversations = await withServerTiming(
    "messages-conversations-query",
    () => listConversations(supabase),
    { route: "/messages" },
  );
  const requested = (await searchParams).conversation;
  const activeConversationId = conversations.some((item) => item.id === requested)
    ? requested ?? null
    : conversations[0]?.id ?? null;
  return (
    <LiveMessagesPage
      currentUserId={userId}
      initialConversations={conversations}
      initialActiveConversationId={activeConversationId}
    />
  );
}
