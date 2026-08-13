import { notFound } from "next/navigation";
import { LiveProfilePage } from "@/components/people/live-profile-page";
import { ProfilePage } from "@/components/people/profile-page";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isLiveMode } from "@/lib/app-mode";
import { getProfileByUsername } from "@/lib/data/profiles";

export default async function Page({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  if (!isLiveMode) return <ProfilePage username={username} />;
  const { supabase, userId } = await getCurrentUser();
  const profile = await getProfileByUsername(supabase, username);
  if (!profile) notFound();
  return <LiveProfilePage profile={profile} own={profile.id === userId} />;
}
