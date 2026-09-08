import { redirect } from "next/navigation";
import { Suspense } from "react";
import { NotificationsPage } from "@/components/demo/notifications-page";
import { LiveNotificationsPage } from "@/components/notifications/live-notifications-page";
import { isLiveMode } from "@/lib/app-mode";
import { getCurrentAuth } from "@/lib/auth/current-user";
import { listNotifications } from "@/lib/data/notifications";
import { withServerTiming } from "@/lib/observability/server-timing";

export default function Page() {
  if (!isLiveMode) return <NotificationsPage />;
  return <Suspense fallback={<div className="page-container max-w-4xl"><div className="h-10 w-64 animate-pulse rounded bg-muted" /><div className="mt-8 h-80 animate-pulse rounded-lg bg-muted/60" /></div>}><NotificationData /></Suspense>;
}

async function NotificationData() {
  const { supabase, userId } = await getCurrentAuth();
  if (!userId) redirect("/login");
  const notifications = await withServerTiming(
    "notifications-list-query",
    () => listNotifications(supabase),
    { route: "/notifications" },
  );
  return <LiveNotificationsPage initialNotifications={notifications} />;
}
