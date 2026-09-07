import { notFound, redirect } from "next/navigation";
import { EventDetail } from "@/components/demo/detail-pages";
import { LiveEventDetail } from "@/components/social/live-detail-pages";
import { getCurrentAuth } from "@/lib/auth/current-user";
import { isLiveMode } from "@/lib/app-mode";
import { getEventBySlug } from "@/lib/data/social";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isLiveMode) return <EventDetail slug={slug} />;
  const { supabase, userId } = await getCurrentAuth();
  if (!userId) redirect("/login");
  const event = await getEventBySlug(supabase, userId, slug);
  if (!event) notFound();
  return <LiveEventDetail event={event} />;
}
