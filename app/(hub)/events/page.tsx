import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SearchableDirectory } from "@/components/catalog/searchable-directory";
import { EventDialog } from "@/components/demo/create-dialogs";
import { LiveEventDialog } from "@/components/social/live-create-dialogs";
import { LiveEventDirectory } from "@/components/social/live-directories";
import { PageHeading } from "@/components/shared/page-heading";
import { RouteDataSkeleton } from "@/components/shared/route-data-skeleton";
import { getCurrentAuth } from "@/lib/auth/current-user";
import { isLiveMode } from "@/lib/app-mode";
import { listEvents } from "@/lib/data/social";
import { withServerTiming } from "@/lib/observability/server-timing";

export default function Page() {
  if (!isLiveMode) return <div className="page-container"><PageHeading eyebrow="Campus calendar" title="Events" description="Workshops, meetups and the first traditions bringing QAIRU’s founding cohort together." action={<EventDialog />} /><SearchableDirectory type="events" /></div>;
  return <div className="page-container"><PageHeading eyebrow="Campus calendar" title="Events" description="Real workshops, meetups and gatherings created by QAIRU students." action={<LiveEventDialog />} /><Suspense fallback={<RouteDataSkeleton label="Loading events" />}><EventData /></Suspense></div>;
}

async function EventData() {
  const { supabase, userId } = await getCurrentAuth();
  if (!userId) redirect("/login");
  const events = await withServerTiming(
    "events-query",
    () => listEvents(supabase, userId),
    { route: "/events" },
  );
  return <LiveEventDirectory events={events} />;
}
