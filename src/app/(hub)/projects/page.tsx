import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SearchableDirectory } from "@/components/catalog/searchable-directory";
import { ProjectDialog } from "@/components/demo/create-dialogs";
import { LiveProjectDialog } from "@/components/social/live-create-dialogs";
import { LiveProjectDirectory } from "@/components/social/live-directories";
import { PageHeading } from "@/components/shared/page-heading";
import { RouteDataSkeleton } from "@/components/shared/route-data-skeleton";
import { getCurrentAuth } from "@/lib/auth/current-user";
import { isLiveMode } from "@/lib/app-mode";
import { listProjects } from "@/lib/data/social";
import { withServerTiming } from "@/lib/observability/server-timing";

export default function Page() {
  if (!isLiveMode) return <div className="page-container"><PageHeading eyebrow="Build together" title="Student projects" description="Follow the first ideas being built at QAIRU, contribute your skills or publish your own." action={<ProjectDialog />} /><SearchableDirectory type="projects" /></div>;
  return <div className="page-container"><PageHeading eyebrow="Build together" title="Student projects" description="Discover real student projects, open roles and teams at QAIRU." action={<LiveProjectDialog />} /><Suspense fallback={<RouteDataSkeleton label="Loading projects" />}><ProjectData /></Suspense></div>;
}

async function ProjectData() {
  const { supabase, userId } = await getCurrentAuth();
  if (!userId) redirect("/login");
  const projects = await withServerTiming(
    "projects-query",
    () => listProjects(supabase, userId),
    { route: "/projects" },
  );
  return <LiveProjectDirectory projects={projects} />;
}
