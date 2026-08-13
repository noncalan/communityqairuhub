import { SearchableDirectory } from "@/components/catalog/searchable-directory";
import { LivePeopleDirectory } from "@/components/people/live-people-directory";
import { PageHeading } from "@/components/shared/page-heading";
import { isLiveMode } from "@/lib/app-mode";
import { listCompletedProfiles } from "@/lib/data/profiles";
import { createClient } from "@/lib/supabase/server";

export default async function Page() {
  const profiles = isLiveMode
    ? await listCompletedProfiles(await createClient())
    : null;
  return (
    <div className="page-container">
      <PageHeading eyebrow="Student directory" title="People at QAIRU" description="Find collaborators by program, skills, interests and what they want to build next." />
      {profiles ? <LivePeopleDirectory profiles={profiles} /> : <SearchableDirectory type="people" />}
    </div>
  );
}
