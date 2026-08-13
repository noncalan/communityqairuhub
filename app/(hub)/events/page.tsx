import { redirect } from "next/navigation";
import { SearchableDirectory } from "@/components/catalog/searchable-directory";
import { EventDialog } from "@/components/demo/create-dialogs";
import { LiveEventDialog } from "@/components/social/live-create-dialogs";
import { LiveEventDirectory } from "@/components/social/live-directories";
import { PageHeading } from "@/components/shared/page-heading";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isLiveMode } from "@/lib/app-mode";
import { listEvents } from "@/lib/data/social";

export default async function Page() {
  if (!isLiveMode) return <div className="page-container"><PageHeading eyebrow="Campus calendar" title="Events" description="Workshops, meetups and the first traditions bringing QAIRU’s founding cohort together." action={<EventDialog />} /><SearchableDirectory type="events" /></div>;
  const { supabase, userId } = await getCurrentUser();
  if (!userId) redirect("/login");
  const events = await listEvents(supabase, userId);
  return <div className="page-container"><PageHeading eyebrow="Campus calendar" title="Events" description="Real workshops, meetups and gatherings created by QAIRU students." action={<LiveEventDialog />} /><LiveEventDirectory events={events} /></div>;
}
