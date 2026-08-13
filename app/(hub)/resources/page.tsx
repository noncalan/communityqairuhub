import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ResourcesPage } from "@/components/demo/resources-page";
import { LiveResourcesPage } from "@/components/resources/live-resources";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isLiveMode } from "@/lib/app-mode";
import { listResources } from "@/lib/data/resources";

export default async function Page() {
  if (!isLiveMode) {
    return <Suspense fallback={<div className="page-container">Loading resources…</div>}><ResourcesPage /></Suspense>;
  }
  const { supabase, userId } = await getCurrentUser();
  if (!userId) redirect("/login");
  const resources = await listResources(supabase);
  return <LiveResourcesPage initialResources={resources} />;
}
