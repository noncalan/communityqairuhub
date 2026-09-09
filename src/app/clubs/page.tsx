import { Plus } from "lucide-react";
import { ClubDirectory } from "@/components/clubs/club-directory";
import { ClientNavLink } from "@/components/shared/client-nav-link";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { isLiveMode } from "@/lib/app-mode";
import { getCurrentProfileGate } from "@/lib/auth/current-user";
import { listPublicClubs } from "@/lib/clubs/data";
import { createAnonymousServerClient } from "@/lib/supabase/anonymous-server";
import { getConfiguredTelegramBotUsername } from "@/lib/telegram/config";

export const metadata = {
  title: "University Clubs",
  description: "Browse active QAIRU student clubs and continue into Telegram.",
};

export default async function ClubsPage() {
  const [clubs, current] = await Promise.all([
    listPublicClubs(createAnonymousServerClient()),
    isLiveMode ? getCurrentProfileGate() : Promise.resolve(null),
  ]);
  const canCreate = Boolean(current?.userId && current.onboardingCompleted);

  return (
    <div className="page-container">
      <PageHeading
        eyebrow="Public university directory"
        title="Student clubs"
        description="Discover active student-led clubs. Each Telegram handoff resolves the latest club information from the same Supabase record used by this website."
        action={canCreate ? (
          <Button asChild>
            <ClientNavLink href="/clubs/new">
              <Plus className="size-4" />
              Create club
            </ClientNavLink>
          </Button>
        ) : undefined}
      />
      <ClubDirectory
        clubs={clubs}
        botUsername={getConfiguredTelegramBotUsername()}
        canCreate={canCreate}
      />
    </div>
  );
}
