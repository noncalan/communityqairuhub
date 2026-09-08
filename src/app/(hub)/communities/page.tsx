import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SearchableDirectory } from "@/components/catalog/searchable-directory";
import { CommunityDialog } from "@/components/demo/create-dialogs";
import { LiveCommunityDialog } from "@/components/social/live-create-dialogs";
import { LiveCommunityDirectory } from "@/components/social/live-directories";
import { PageHeading } from "@/components/shared/page-heading";
import { RouteDataSkeleton } from "@/components/shared/route-data-skeleton";
import { getCurrentAuth } from "@/lib/auth/current-user";
import { isLiveMode } from "@/lib/app-mode";
import { listCommunities } from "@/lib/data/social";
import { withServerTiming } from "@/lib/observability/server-timing";

export default function Page() {
  if (!isLiveMode) return <div className="page-container"><PageHeading eyebrow="Student-led spaces" title="Communities" description="Join founding groups, share early work and help shape QAIRU traditions." action={<CommunityDialog />} /><SearchableDirectory type="communities" /></div>;
  return <div className="page-container"><PageHeading eyebrow="Student-led spaces" title="Communities" description="Join real student-led groups and help shape QAIRU traditions." action={<LiveCommunityDialog />} /><Suspense fallback={<RouteDataSkeleton label="Loading communities" />}><CommunityData /></Suspense></div>;
}

async function CommunityData() {
  const { supabase, userId } = await getCurrentAuth();
  if (!userId) redirect("/login");
  const communities = await withServerTiming(
    "communities-query",
    () => listCommunities(supabase, userId),
    { route: "/communities" },
  );
  return <LiveCommunityDirectory communities={communities} />;
}
