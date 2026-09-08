import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { LiveActivityProvider } from "@/components/activity/live-activity-provider";
import { CurrentUserProvider } from "@/lib/auth/current-user-provider";
import { getCurrentUserSummary } from "@/lib/auth/current-user";
import { isLiveMode } from "@/lib/app-mode";
import { withServerTiming } from "@/lib/observability/server-timing";

export default function HubLayout({ children }: { children: React.ReactNode }) {
  if (!isLiveMode) return <AppShell>{children}</AppShell>;
  return (
    <Suspense fallback={<HubShellFallback />}>
      <AuthenticatedHub>{children}</AuthenticatedHub>
    </Suspense>
  );
}

async function AuthenticatedHub({ children }: { children: React.ReactNode }) {
  const current = await withServerTiming(
    "hub-layout-loaders",
    () => getCurrentUserSummary(),
    { route: "(hub)" },
  );
  const { userId, profile } = current;
  if (!userId) redirect("/login");
  if (!profile?.onboardingCompleted) redirect("/onboarding");
  return (
    <CurrentUserProvider key={userId} initialProfile={profile}>
      <LiveActivityProvider userId={userId}>
        <AppShell>{children}</AppShell>
      </LiveActivityProvider>
    </CurrentUserProvider>
  );
}

function HubShellFallback() {
  return (
    <div className="min-h-screen bg-background" aria-label="Loading QAIRU Hub">
      <aside className="fixed inset-y-0 start-0 hidden w-[220px] border-e bg-sidebar/90 p-5 lg:block">
        <div className="h-8 w-32 animate-pulse rounded bg-muted" />
        <div className="mt-8 h-9 animate-pulse rounded bg-muted" />
        <div className="mt-8 space-y-3">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="h-9 animate-pulse rounded bg-muted/70" />
          ))}
        </div>
      </aside>
      <div className="h-14 animate-pulse border-b bg-muted/30 lg:ms-[220px]" />
      <main className="lg:ms-[220px]">
        <div className="page-container">
          <div className="h-10 w-72 animate-pulse rounded bg-muted" />
          <div className="mt-8 h-72 animate-pulse rounded-lg bg-muted/60" />
        </div>
      </main>
    </div>
  );
}
