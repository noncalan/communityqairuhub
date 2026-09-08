import { Suspense } from "react";
import { redirect } from "next/navigation";
import { SettingsPage } from "@/components/demo/settings-page";
import { LiveSettingsPage } from "@/components/people/live-settings-page";
import { isLiveMode } from "@/lib/app-mode";
import { getCurrentAuth, getCurrentUser } from "@/lib/auth/current-user";
import { getProfileReferences } from "@/lib/data/profiles";
import { withServerTiming } from "@/lib/observability/server-timing";

export default function Page() {
  if (isLiveMode) {
    return <Suspense fallback={<div className="page-container"><div className="h-10 w-52 animate-pulse rounded bg-muted" /><div className="mt-8 h-[560px] animate-pulse rounded-lg bg-muted/60" /></div>}><SettingsData /></Suspense>;
  }
  return <Suspense fallback={<div className="page-container">Loading settings…</div>}><SettingsPage /></Suspense>;
}

async function SettingsData() {
    const { current, references } = await withServerTiming(
      "settings-page-loaders",
      async () => {
        const auth = await getCurrentAuth();
        const [current, references] = await Promise.all([
          getCurrentUser(),
          getProfileReferences(auth.supabase),
        ]);
        return { current, references };
      },
      { route: "/settings" },
    );
    if (!current.userId || !current.profile) redirect("/login");
    return <LiveSettingsPage initialProfile={current.profile} references={references} />;
}
