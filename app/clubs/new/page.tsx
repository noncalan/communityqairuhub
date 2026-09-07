import { redirect } from "next/navigation";
import { ClubForm } from "@/components/clubs/club-form";
import { PageHeading } from "@/components/shared/page-heading";
import { getCurrentProfileGate } from "@/lib/auth/current-user";
import { getAllowedClubLogoOrigins } from "@/lib/clubs/logo-origins";
import type { ClubInput } from "@/lib/clubs/validation";
import { getConfiguredTelegramBotUsername } from "@/lib/telegram/config";

export default async function NewClubPage() {
  const current = await getCurrentProfileGate();
  if (!current.userId) redirect("/login?next=%2Fclubs%2Fnew");
  const initialValue: ClubInput = {
    name: "",
    slug: "",
    shortDescription: "",
    description: "",
    category: "",
    logoUrl: "",
    leaderName: current.profileGate?.full_name ?? "",
    contact: current.email ?? "",
    status: "forming",
    telegramGroupUrl: "",
    telegramPublicUsername: "",
    telegramChatId: "",
  };
  return (
    <div className="page-container">
      <PageHeading
        eyebrow="Organizer workspace"
        title="Create a university club"
        description="Publish one shared club record for the website and Telegram bot. Start as an inactive draft if details are not ready."
      />
      <ClubForm
        mode="create"
        initialValue={initialValue}
        botUsername={getConfiguredTelegramBotUsername()}
        allowedLogoOrigins={getAllowedClubLogoOrigins()}
      />
    </div>
  );
}
