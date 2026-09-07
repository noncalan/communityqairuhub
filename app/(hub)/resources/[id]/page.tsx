import { notFound, redirect } from "next/navigation";
import { LiveResourceDetail } from "@/components/resources/live-resources";
import { getCurrentAuth } from "@/lib/auth/current-user";
import { isLiveMode } from "@/lib/app-mode";
import { getResourceById } from "@/lib/data/resources";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isLiveMode) redirect(`/resources?resource=${encodeURIComponent(id)}`);
  if (!uuidPattern.test(id)) notFound();
  const { supabase, userId } = await getCurrentAuth();
  if (!userId) redirect("/login");
  const resource = await getResourceById(supabase, id);
  if (!resource) notFound();
  return <LiveResourceDetail resource={resource} />;
}
