import { notFound } from "next/navigation";
import { ClubDetail } from "@/components/clubs/club-detail";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getManagedClubBySlug, getPublicClubBySlug } from "@/lib/clubs/data";
import { createAnonymousServerClient } from "@/lib/supabase/anonymous-server";
import { getConfiguredTelegramBotUsername } from "@/lib/telegram/config";
import { buildClubBotDeepLink } from "@/lib/telegram/validation";

export default async function ClubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const club = await getPublicClubBySlug(createAnonymousServerClient(), slug);
  if (!club) notFound();
  const botUsername = getConfiguredTelegramBotUsername();
  const botDeepLink = botUsername && club.telegramConfigured
    ? buildClubBotDeepLink(botUsername, club.botKey)
    : null;
  const current = await getCurrentUser();
  const managedClub = current.userId
    ? await getManagedClubBySlug(current.supabase, current.userId, slug)
    : null;
  return <ClubDetail club={club} botDeepLink={botDeepLink} canManage={Boolean(managedClub)} />;
}
