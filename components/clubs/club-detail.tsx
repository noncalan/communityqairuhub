import Link from "next/link";
import { ArrowLeft, Bot, ExternalLink, Mail, Pencil, Send, ShieldCheck, UserRound } from "lucide-react";
import { ClubLogo } from "@/components/clubs/club-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PublicClub } from "@/lib/clubs/data";

export function ClubDetail({
  club,
  botDeepLink,
  canManage,
}: {
  club: PublicClub;
  botDeepLink: string | null;
  canManage: boolean;
}) {
  return (
    <div className="page-container">
      <Link href="/clubs" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Club directory
      </Link>
      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <main>
          <div className="flex flex-col gap-6 border-b pb-8 sm:flex-row sm:items-start">
            <ClubLogo name={club.name} logoUrl={club.logoUrl} className="size-24 shrink-0 rounded-2xl text-2xl" />
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{club.category}</Badge>
                <Badge>Active</Badge>
              </div>
              <h1 className="mt-4 text-balance text-4xl font-semibold tracking-[-0.055em] sm:text-5xl">
                {club.name}
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
                {club.shortDescription}
              </p>
            </div>
          </div>
          <section className="py-8">
            <p className="eyebrow">About the club</p>
            <p className="mt-4 max-w-3xl whitespace-pre-wrap text-base leading-7">
              {club.description}
            </p>
          </section>
        </main>

        <aside className="space-y-4">
          {canManage && (
            <Button variant="outline" className="w-full" asChild>
              <Link href={`/clubs/${club.slug}/edit`}><Pencil className="size-4" /> Edit club</Link>
            </Button>
          )}
          <div className="surface rounded-xl p-5">
            <p className="eyebrow">Telegram</p>
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.035em]">
              Continue the conversation
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              The bot reads this club directly from QAIRU&apos;s shared Supabase backend.
            </p>
            {botDeepLink ? (
              <Button className="mt-5 w-full" size="lg" asChild>
                <a href={botDeepLink} target="_blank" rel="noreferrer">
                  <Send className="size-4" /> Join via Telegram
                </a>
              </Button>
            ) : (
              <div className="mt-5 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                {club.telegramConfigured
                  ? "The group is configured, but the QAIRU bot environment is not ready yet."
                  : "This club has not configured a Telegram group yet."}
              </div>
            )}
            <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" />
              <span>
                {club.telegramConfigured
                  ? "Group configured. Bot administrator status is not claimed or verified by this prototype."
                  : "Not configured."}
              </span>
            </div>
          </div>

          <div className="surface rounded-xl p-5">
            <p className="eyebrow">Club contact</p>
            <Info icon={UserRound} label="Leader" value={club.leaderName} />
            <Info icon={Mail} label="Contact" value={club.contact ?? "Not provided"} />
            {club.telegramPublicUsername && (
              <a
                href={`https://t.me/${club.telegramPublicUsername}`}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                <Bot className="size-4" /> @{club.telegramPublicUsername}
                <ExternalLink className="size-3.5" />
              </a>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
}) {
  return (
    <div className="mt-5 flex gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-muted">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-1 break-words text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
