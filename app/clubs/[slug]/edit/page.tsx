import { notFound, redirect } from "next/navigation";
import { ClubForm } from "@/components/clubs/club-form";
import { PageHeading } from "@/components/shared/page-heading";
import { getCurrentAuth } from "@/lib/auth/current-user";
import { getManagedClubBySlug } from "@/lib/clubs/data";
import { getAllowedClubLogoOrigins } from "@/lib/clubs/logo-origins";
import type { ClubInput } from "@/lib/clubs/validation";
import { getConfiguredTelegramBotUsername } from "@/lib/telegram/config";

export default async function EditClubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const current = await getCurrentAuth();
  if (!current.userId) {
    redirect(`/login?next=${encodeURIComponent(`/clubs/${slug}/edit`)}`);
  }
  const club = await getManagedClubBySlug(current.supabase, current.userId, slug);
  if (!club) notFound();
  const initialValue: ClubInput = {
    name: club.name,
    slug: club.slug,
    shortDescription: club.shortDescription,
    description: club.description,
    category: club.category,
    logoUrl: club.logoUrl ?? "",
    leaderName: club.leaderName,
    contact: club.contact ?? "",
    status: club.status,
    telegramGroupUrl: club.telegramGroupUrl ?? "",
    telegramPublicUsername: club.telegramPublicUsername ?? "",
    telegramChatId: club.telegramChatId ?? "",
  };
  return (
    <div className="page-container">
      <PageHeading
        eyebrow="Organizer workspace"
        title={`Edit ${club.name}`}
        description="Website and bot output update from the same Supabase transaction. Bot administrator verification remains a separate future capability."
      />
      <ClubForm
        mode="edit"
        initialValue={initialValue}
        clubId={club.id}
        botKey={club.botKey}
        botUsername={getConfiguredTelegramBotUsername()}
        allowedLogoOrigins={getAllowedClubLogoOrigins()}
      />
    </div>
  );
}
