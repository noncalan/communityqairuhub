import { ClubDirectory } from "@/components/clubs/club-directory";
import { PageHeading } from "@/components/shared/page-heading";
import { listPublicClubs } from "@/lib/clubs/data";
import { createAnonymousServerClient } from "@/lib/supabase/anonymous-server";
import { getConfiguredTelegramBotUsername } from "@/lib/telegram/config";

export const metadata = {
  title: "University Clubs",
  description: "Browse active QAIRU student clubs and continue into Telegram.",
};

export default async function ClubsPage() {
  const clubs = await listPublicClubs(createAnonymousServerClient());
  return (
    <div className="page-container">
      <PageHeading
        eyebrow="Public university directory"
        title="Student clubs"
        description="Discover active student-led clubs. Each Telegram handoff resolves the latest club information from the same Supabase record used by this website."
      />
      <ClubDirectory clubs={clubs} botUsername={getConfiguredTelegramBotUsername()} />
    </div>
  );
}
