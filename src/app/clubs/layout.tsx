import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { RouteDataSkeleton } from "@/components/shared/route-data-skeleton";
import { isLiveMode } from "@/lib/app-mode";
import { getCurrentProfileGate } from "@/lib/auth/current-user";

export default function ClubsLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<AppShell liveAccount={null}><ClubsContentFallback /></AppShell>}>
      <ClubsAccessGate>{children}</ClubsAccessGate>
    </Suspense>
  );
}

async function ClubsAccessGate({ children }: { children: React.ReactNode }) {
  if (!isLiveMode) return <AppShell>{children}</AppShell>;

  const current = await getCurrentProfileGate();
  if (current.userId && !current.onboardingCompleted) redirect("/onboarding");

  const liveAccount = current.profileGate
    ? {
        username: current.profileGate.username,
        fullName: current.profileGate.full_name,
      }
    : null;

  return <AppShell liveAccount={liveAccount}>{children}</AppShell>;
}

function ClubsContentFallback() {
  return (
    <div className="page-container" aria-label="Loading clubs">
      <div className="h-3 w-32 animate-pulse rounded bg-muted" />
      <div className="mt-4 h-10 w-64 animate-pulse rounded bg-muted" />
      <RouteDataSkeleton label="Loading clubs" />
    </div>
  );
}
