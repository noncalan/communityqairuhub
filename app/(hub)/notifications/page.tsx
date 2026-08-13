import { redirect } from "next/navigation";
import { NotificationsPage } from "@/components/demo/notifications-page";
import { LiveNotificationsPage } from "@/components/notifications/live-notifications-page";
import { isLiveMode } from "@/lib/app-mode";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listNotifications } from "@/lib/data/notifications";

export default async function Page() {
  if (!isLiveMode) return <NotificationsPage />;
  const { supabase, userId } = await getCurrentUser();
  if (!userId) redirect("/login");
  return <LiveNotificationsPage initialNotifications={await listNotifications(supabase)} />;
}
