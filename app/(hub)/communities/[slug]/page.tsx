import { notFound, redirect } from "next/navigation";
import { CommunityDetail } from "@/components/demo/detail-pages";
import { LiveCommunityDetail } from "@/components/social/live-detail-pages";
import { getCurrentAuth } from "@/lib/auth/current-user";
import { isLiveMode } from "@/lib/app-mode";
import { listCommunityPosts } from "@/lib/data/posts";
import { getCommunityBySlug } from "@/lib/data/social";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isLiveMode) return <CommunityDetail slug={slug} />;
  const { supabase, userId } = await getCurrentAuth();
  if (!userId) redirect("/login");
  const community = await getCommunityBySlug(supabase, userId, slug);
  if (!community) notFound();
  const posts = await listCommunityPosts(supabase, community.id);
  return <LiveCommunityDetail community={community} posts={posts} currentUserId={userId} />;
}
