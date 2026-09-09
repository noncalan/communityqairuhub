import { Search, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ProjectFinder } from "@/components/find/project-finder";
import { LivePeopleDirectory } from "@/components/people/live-people-directory";
import { ClientNavLink } from "@/components/shared/client-nav-link";
import { PageHeading } from "@/components/shared/page-heading";
import { RouteDataSkeleton } from "@/components/shared/route-data-skeleton";
import { Button } from "@/components/ui/button";
import { isLiveMode } from "@/lib/app-mode";
import { getCurrentAuth } from "@/lib/auth/current-user";
import { listCompletedProfiles } from "@/lib/data/profiles";
import { listProjectOpportunities } from "@/lib/data/team-finder";
import { withServerTiming } from "@/lib/observability/server-timing";

export const metadata = {
  title: "Team Finder",
  description: "Discover open project roles and students ready to collaborate.",
};

type FinderMode = "projects" | "people";

export default async function FindPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string | string[] }>;
}) {
  const params = await searchParams;
  const mode: FinderMode = params.mode === "people" ? "people" : "projects";

  return (
    <div className="page-container">
      <PageHeading
        eyebrow="Build a team"
        title="Team Finder"
        description="Choose people directly: discover an open project role or find a student whose skills fit your team."
      />
      <nav aria-label="Team Finder mode" className="mb-8 flex w-full gap-2 rounded-xl bg-muted p-1 sm:w-fit">
        <Button variant={mode === "projects" ? "default" : "ghost"} className="flex-1 sm:flex-none" asChild>
          <ClientNavLink href="/find" aria-current={mode === "projects" ? "page" : undefined}>
            <Search className="size-4" />
            Find a project
          </ClientNavLink>
        </Button>
        <Button variant={mode === "people" ? "default" : "ghost"} className="flex-1 sm:flex-none" asChild>
          <ClientNavLink href="/find?mode=people" aria-current={mode === "people" ? "page" : undefined}>
            <Users className="size-4" />
            Find people
          </ClientNavLink>
        </Button>
      </nav>
      {!isLiveMode ? (
        <div className="surface rounded-xl px-6 py-20 text-center">
          <h2 className="font-semibold">Team Finder requires live mode</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            This page never substitutes demo people or projects for live Supabase data.
          </p>
        </div>
      ) : (
        <Suspense key={mode} fallback={<RouteDataSkeleton label={`Loading ${mode === "projects" ? "open roles" : "people"}`} />}>
          <FinderData mode={mode} />
        </Suspense>
      )}
    </div>
  );
}

async function FinderData({ mode }: { mode: FinderMode }) {
  const current = await getCurrentAuth();
  if (!current.userId) redirect("/login?next=%2Ffind");

  if (mode === "people") {
    const profiles = await withServerTiming(
      "team-finder-people-query",
      () => listCompletedProfiles(current.supabase),
      { route: "/find", mode },
    );
    return <LivePeopleDirectory profiles={profiles} teamFinder />;
  }

  const opportunities = await withServerTiming(
    "team-finder-project-query",
    () => listProjectOpportunities(current.supabase, current.userId!),
    { route: "/find", mode },
  );
  return <ProjectFinder opportunities={opportunities} />;
}
