import { redirect } from "next/navigation";
import { SearchableDirectory } from "@/components/catalog/searchable-directory";
import { CommunityDialog } from "@/components/demo/create-dialogs";
import { LiveCommunityDialog } from "@/components/social/live-create-dialogs";
import { LiveCommunityDirectory } from "@/components/social/live-directories";
import { PageHeading } from "@/components/shared/page-heading";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isLiveMode } from "@/lib/app-mode";
import { listCommunities } from "@/lib/data/social";

export default async function Page() {
  if (!isLiveMode) return <div className="page-container"><PageHeading eyebrow="Student-led spaces" title="Communities" description="Join founding groups, share early work and help shape QAIRU traditions." action={<CommunityDialog />} /><SearchableDirectory type="communities" /></div>;
  const { supabase, userId } = await getCurrentUser();
  if (!userId) redirect("/login");
  const communities = await listCommunities(supabase, userId);
  return <div className="page-container"><PageHeading eyebrow="Student-led spaces" title="Communities" description="Join real student-led groups and help shape QAIRU traditions." action={<LiveCommunityDialog />} /><LiveCommunityDirectory communities={communities} /></div>;
}
