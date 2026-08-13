import { redirect } from "next/navigation";
import { SearchableDirectory } from "@/components/catalog/searchable-directory";
import { ProjectDialog } from "@/components/demo/create-dialogs";
import { LiveProjectDialog } from "@/components/social/live-create-dialogs";
import { LiveProjectDirectory } from "@/components/social/live-directories";
import { PageHeading } from "@/components/shared/page-heading";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isLiveMode } from "@/lib/app-mode";
import { listProjects } from "@/lib/data/social";

export default async function Page() {
  if (!isLiveMode) return <div className="page-container"><PageHeading eyebrow="Build together" title="Student projects" description="Follow the first ideas being built at QAIRU, contribute your skills or publish your own." action={<ProjectDialog />} /><SearchableDirectory type="projects" /></div>;
  const { supabase, userId } = await getCurrentUser();
  if (!userId) redirect("/login");
  const projects = await listProjects(supabase, userId);
  return <div className="page-container"><PageHeading eyebrow="Build together" title="Student projects" description="Discover real student projects, open roles and teams at QAIRU." action={<LiveProjectDialog />} /><LiveProjectDirectory projects={projects} /></div>;
}
