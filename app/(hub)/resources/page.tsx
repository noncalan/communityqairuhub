import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ResourcesPage } from "@/components/demo/resources-page";
import { LiveResourcesPage } from "@/components/resources/live-resources";
import { getCurrentAuth } from "@/lib/auth/current-user";
import { isLiveMode } from "@/lib/app-mode";
import { listResources } from "@/lib/data/resources";
import { withServerTiming } from "@/lib/observability/server-timing";

export default function Page() {
  if (!isLiveMode) {
    return <Suspense fallback={<div className="page-container">Loading resources…</div>}><ResourcesPage /></Suspense>;
  }
  return <Suspense fallback={<div className="page-container"><div className="h-10 w-64 animate-pulse rounded bg-muted" /><div className="mt-8 h-96 animate-pulse rounded-lg bg-muted/60" /></div>}><ResourceData /></Suspense>;
}

async function ResourceData() {
  const { supabase, userId } = await getCurrentAuth();
  if (!userId) redirect("/login");
  const resources = await withServerTiming(
    "resources-query",
    () => listResources(supabase),
    { route: "/resources" },
  );
  return <LiveResourcesPage initialResources={resources} />;
}
