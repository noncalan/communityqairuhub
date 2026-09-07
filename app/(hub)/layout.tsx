import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { LiveActivityProvider } from "@/components/activity/live-activity-provider";
import { CurrentUserProvider } from "@/lib/auth/current-user-provider";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isLiveMode } from "@/lib/app-mode";
import { getActivityCounts } from "@/lib/data/notifications";
import { withServerTiming } from "@/lib/observability/server-timing";

export default async function HubLayout({ children }: { children: React.ReactNode }) {
  if (!isLiveMode) return <AppShell>{children}</AppShell>;
  const { current, counts } = await withServerTiming(
    "hub-layout-loaders",
    async () => {
      const current = await getCurrentUser();
      const counts = current.userId && current.profile?.onboardingCompleted
        ? await getActivityCounts(current.supabase)
        : null;
      return { current, counts };
    },
    { route: "(hub)" },
  );
  const { userId, profile } = current;
  if (!userId) redirect("/login");
  if (!profile?.onboardingCompleted) redirect("/onboarding");
  return (
    <CurrentUserProvider key={userId} initialProfile={profile}>
      <LiveActivityProvider
        userId={userId}
        initialMessageUnreadCount={counts!.messages}
        initialNotificationUnreadCount={counts!.notifications}
      >
        <AppShell>{children}</AppShell>
      </LiveActivityProvider>
    </CurrentUserProvider>
  );
}
