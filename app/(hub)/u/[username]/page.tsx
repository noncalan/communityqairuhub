import { notFound } from "next/navigation";
import { LiveProfilePage } from "@/components/people/live-profile-page";
import { ProfilePage } from "@/components/people/profile-page";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isLiveMode } from "@/lib/app-mode";
import { getProfileByUsername } from "@/lib/data/profiles";
import { getFollowSnapshot } from "@/lib/data/social";

export default async function Page({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  if (!isLiveMode) return <ProfilePage username={username} />;
  const { supabase, userId } = await getCurrentUser();
  const profile = await getProfileByUsername(supabase, username);
  if (!profile) notFound();
  if (!userId) notFound();
  const follows = await getFollowSnapshot(supabase, userId, [profile.id]);
  return <LiveProfilePage
    profile={profile}
    own={profile.id === userId}
    following={follows.followingIds.includes(profile.id)}
    followerCount={follows.followerCounts[profile.id] ?? 0}
    followingCount={follows.followingCounts[profile.id] ?? 0}
  />;
}
