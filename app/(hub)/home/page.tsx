import { redirect } from "next/navigation";
import { HomeFeed } from "@/components/home/home-feed";
import { LiveHome } from "@/components/home/live-home";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isLiveMode } from "@/lib/app-mode";
import { listHomeFeed } from "@/lib/data/posts";
import { listCommunities, listEvents, listProjects } from "@/lib/data/social";
import { withServerTiming } from "@/lib/observability/server-timing";

export default async function Page() {
  if (!isLiveMode) return <HomeFeed />;
  const { current, payload } = await withServerTiming(
    "home-page-loaders",
    async () => {
      const current = await getCurrentUser();
      if (!current.userId || !current.profile) {
        return { current, payload: null };
      }
      const [communities, projects, events, feed] = await Promise.all([
        listCommunities(current.supabase, current.userId),
        listProjects(current.supabase, current.userId),
        listEvents(current.supabase, current.userId),
        listHomeFeed(current.supabase, current.userId),
      ]);
      return { current, payload: { communities, projects, events, feed } };
    },
    { route: "/home" },
  );
  const { userId, profile } = current;
  if (!userId || !profile) redirect("/login");
  const { communities, projects, events, feed } = payload!;
  return <LiveHome currentUserId={userId} firstName={profile.fullName.split(" ")[0]} communities={communities} projects={projects} events={events} feed={feed.items} />;
}
