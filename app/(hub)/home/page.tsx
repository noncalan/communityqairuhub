import { redirect } from "next/navigation";
import { HomeFeed } from "@/components/home/home-feed";
import { LiveHome } from "@/components/home/live-home";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isLiveMode } from "@/lib/app-mode";
import { listHomeFeed } from "@/lib/data/posts";
import { listCommunities, listEvents, listProjects } from "@/lib/data/social";

export default async function Page() {
  if (!isLiveMode) return <HomeFeed />;
  const { supabase, userId, profile } = await getCurrentUser();
  if (!userId || !profile) redirect("/login");
  const [communities, projects, events, feed] = await Promise.all([
    listCommunities(supabase, userId),
    listProjects(supabase, userId),
    listEvents(supabase, userId),
    listHomeFeed(supabase, userId),
  ]);
  return <LiveHome currentUserId={userId} firstName={profile.fullName.split(" ")[0]} communities={communities} projects={projects} events={events} feed={feed.items} />;
}
