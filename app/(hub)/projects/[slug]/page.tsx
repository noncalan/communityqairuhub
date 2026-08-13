import { notFound, redirect } from "next/navigation";
import { ProjectDetail } from "@/components/demo/detail-pages";
import { LiveProjectDetail } from "@/components/social/live-detail-pages";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isLiveMode } from "@/lib/app-mode";
import { getProjectBySlug } from "@/lib/data/social";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isLiveMode) return <ProjectDetail slug={slug} />;
  const { supabase, userId } = await getCurrentUser();
  if (!userId) redirect("/login");
  const project = await getProjectBySlug(supabase, userId, slug);
  if (!project) notFound();
  return <LiveProjectDetail project={project} />;
}
