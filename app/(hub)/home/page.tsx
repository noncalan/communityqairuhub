import { redirect } from "next/navigation";
import { HomeFeed } from "@/components/home/home-feed";
import { LiveHome } from "@/components/home/live-home";
import { getCurrentAuth } from "@/lib/auth/current-user";
import { isLiveMode } from "@/lib/app-mode";
import {
  listHomeCommunities,
  listHomeEvents,
  listHomeProjects,
} from "@/lib/data/home";
import { listHomeFeed } from "@/lib/data/posts";
import { withServerTiming } from "@/lib/observability/server-timing";

export default async function Page() {
  if (!isLiveMode) return <HomeFeed />;
  const current = await withServerTiming(
    "home-page-loaders",
    () => getCurrentAuth(),
    { route: "/home" },
  );
  const { userId } = current;
  if (!userId) redirect("/login");
  const communities = withServerTiming(
    "home-communities-loader",
    () => listHomeCommunities(current.supabase, userId),
    { route: "/home" },
  );
  const projects = withServerTiming(
    "home-projects-loader",
    () => listHomeProjects(current.supabase),
    { route: "/home" },
  );
  const events = withServerTiming(
    "home-events-loader",
    () => listHomeEvents(current.supabase),
    { route: "/home" },
  );
  const feed = withServerTiming(
    "home-feed-loader",
    async () => (await listHomeFeed(current.supabase, userId)).items,
    { route: "/home" },
  );
  return (
    <LiveHome
      currentUserId={userId}
      communities={communities}
      projects={projects}
      events={events}
      feed={feed}
    />
  );
}
