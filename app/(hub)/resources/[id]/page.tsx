import { notFound, redirect } from "next/navigation";
import { LiveResourceDetail } from "@/components/resources/live-resources";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isLiveMode } from "@/lib/app-mode";
import { getResourceById } from "@/lib/data/resources";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isLiveMode) redirect(`/resources?resource=${encodeURIComponent(id)}`);
  const { supabase, userId } = await getCurrentUser();
  if (!userId) redirect("/login");
  const resource = await getResourceById(supabase, id);
  if (!resource) notFound();
  return <LiveResourceDetail resource={resource} />;
}
