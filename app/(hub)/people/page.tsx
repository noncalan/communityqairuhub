import { Suspense } from "react";
import { SearchableDirectory } from "@/components/catalog/searchable-directory";
import { LivePeopleDirectory } from "@/components/people/live-people-directory";
import { PageHeading } from "@/components/shared/page-heading";
import { isLiveMode } from "@/lib/app-mode";
import { getCurrentAuth } from "@/lib/auth/current-user";
import { listCompletedProfiles } from "@/lib/data/profiles";
import { withServerTiming } from "@/lib/observability/server-timing";

export default function Page() {
  return (
    <div className="page-container">
      <PageHeading eyebrow="Student directory" title="People at QAIRU" description="Find collaborators by program, skills, interests and what they want to build next." />
      {isLiveMode ? (
        <Suspense fallback={<PeopleDirectoryFallback />}>
          <PeopleData />
        </Suspense>
      ) : <SearchableDirectory type="people" />}
    </div>
  );
}

async function PeopleData() {
  const profiles = await withServerTiming(
    "people-loaders",
    async () => {
      const current = await getCurrentAuth();
      if (!current.userId) return [];
      return withServerTiming(
        "people-profiles-loader",
        () => listCompletedProfiles(current.supabase),
        { route: "/people" },
      );
    },
    { route: "/people" },
  );
  return <LivePeopleDirectory profiles={profiles} />;
}

function PeopleDirectoryFallback() {
  return (
    <div className="mt-7 grid gap-x-10 lg:grid-cols-2" aria-label="Loading people">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="h-44 animate-pulse border-b bg-muted/30" />
      ))}
    </div>
  );
}
