import { Suspense } from "react";
import { SettingsPage } from "@/components/demo/settings-page";
import { LiveSettingsPage } from "@/components/people/live-settings-page";
import { isLiveMode } from "@/lib/app-mode";
import { getProfileReferences } from "@/lib/data/profiles";
import { createClient } from "@/lib/supabase/server";

export default async function Page() {
  if (isLiveMode) {
    const references = await getProfileReferences(await createClient());
    return <LiveSettingsPage references={references} />;
  }
  return <Suspense fallback={<div className="page-container">Loading settings…</div>}><SettingsPage /></Suspense>;
}
