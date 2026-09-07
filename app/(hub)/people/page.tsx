import { SearchableDirectory } from "@/components/catalog/searchable-directory";
import { LivePeopleDirectory } from "@/components/people/live-people-directory";
import { PageHeading } from "@/components/shared/page-heading";
import { isLiveMode } from "@/lib/app-mode";
import { getCurrentAuth } from "@/lib/auth/current-user";
import { listCompletedProfiles } from "@/lib/data/profiles";
import { getFollowSnapshot } from "@/lib/data/social";

export default async function Page() {
  const live = isLiveMode ? await getCurrentAuth() : null;
  const profiles = live ? await listCompletedProfiles(live.supabase) : null;
  const follows = live && live.userId && profiles
    ? await getFollowSnapshot(live.supabase, live.userId, profiles.map((profile) => profile.id))
    : null;
  return (
    <div className="page-container">
      <PageHeading eyebrow="Student directory" title="People at QAIRU" description="Find collaborators by program, skills, interests and what they want to build next." />
      {profiles && follows ? <LivePeopleDirectory profiles={profiles} follows={follows} /> : <SearchableDirectory type="people" />}
    </div>
  );
}
