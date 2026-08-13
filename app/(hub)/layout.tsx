import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { LiveActivityProvider } from "@/components/activity/live-activity-provider";
import { CurrentUserProvider } from "@/lib/auth/current-user-provider";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isLiveMode } from "@/lib/app-mode";
import { getActivityCounts } from "@/lib/data/notifications";

export default async function HubLayout({ children }: { children: React.ReactNode }) {
  if (!isLiveMode) return <AppShell>{children}</AppShell>;
  const { supabase, userId, profile } = await getCurrentUser();
  if (!userId) redirect("/login");
  if (!profile?.onboardingCompleted) redirect("/onboarding");
  const counts = await getActivityCounts(supabase);
  return (
    <CurrentUserProvider initialProfile={profile}>
      <LiveActivityProvider
        userId={userId}
        initialMessageUnreadCount={counts.messages}
        initialNotificationUnreadCount={counts.notifications}
      >
        <AppShell>{children}</AppShell>
      </LiveActivityProvider>
    </CurrentUserProvider>
  );
}
