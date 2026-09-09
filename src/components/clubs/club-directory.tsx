"use client";

import { ArrowUpRight, Bot, Plus, Search, Send, Users } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { ClubLogo } from "@/components/clubs/club-logo";
import { ClientNavLink } from "@/components/shared/client-nav-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PublicClub } from "@/lib/clubs/data";
import { buildClubBotDeepLink } from "@/lib/telegram/validation";

export function ClubDirectory({
  clubs,
  botUsername,
  canCreate,
}: {
  clubs: PublicClub[];
  botUsername: string | null;
  canCreate: boolean;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const categories = useMemo(
    () => [...new Set(clubs.map((club) => club.category))].sort(),
    [clubs],
  );
  const filtered = useMemo(
    () => clubs.filter((club) => {
      if (category !== "All" && club.category !== category) return false;
      if (!deferredQuery) return true;
      return [club.name, club.shortDescription, club.description, club.category, club.leaderName]
        .join(" ")
        .toLowerCase()
        .includes(deferredQuery);
    }),
    [category, clubs, deferredQuery],
  );
  const hasActiveFilters = Boolean(deferredQuery) || category !== "All";

  return (
    <>
      <div className="mb-7 flex flex-col gap-3 border-y py-4 sm:flex-row sm:items-center">
        <div className="relative max-w-xl flex-1">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="ps-9"
            placeholder="Search clubs, categories, or leaders"
            aria-label="Search clubs"
          />
        </div>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="h-10 rounded-md border bg-background px-3 text-sm"
          aria-label="Filter by category"
        >
          <option>All</option>
          {categories.map((item) => <option key={item}>{item}</option>)}
        </select>
        <span className="text-xs text-muted-foreground sm:ms-auto">
          {filtered.length} {filtered.length === 1 ? "club" : "clubs"}
        </span>
      </div>

      {filtered.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((club) => {
            const botLink = botUsername && club.telegramConfigured
              ? buildClubBotDeepLink(botUsername, club.botKey)
              : null;
            return (
              <article key={club.id} className="surface flex min-h-72 flex-col rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <ClubLogo name={club.name} logoUrl={club.logoUrl} className="size-14 shrink-0 rounded-xl" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{club.category}</Badge>
                      <Badge variant={club.telegramConfigured ? "default" : "outline"}>
                        {club.telegramConfigured ? "Telegram ready" : "Telegram not set"}
                      </Badge>
                    </div>
                    <h2 className="mt-2 text-xl font-semibold tracking-[-0.035em]">
                      <ClientNavLink href={`/clubs/${club.slug}`} className="hover:text-primary">
                        {club.name}
                      </ClientNavLink>
                    </h2>
                  </div>
                </div>
                <p className="mt-5 text-sm leading-6 text-muted-foreground">
                  {club.shortDescription}
                </p>
                <div className="mt-auto flex items-center gap-2 pt-6">
                  <Button variant="outline" className="flex-1" asChild>
                    <ClientNavLink href={`/clubs/${club.slug}`}>
                      View club <ArrowUpRight className="size-4" />
                    </ClientNavLink>
                  </Button>
                  {botLink ? (
                    <Button size="icon" asChild aria-label={`Open ${club.name} in Telegram`}>
                      <a href={botLink} target="_blank" rel="noreferrer">
                        <Send className="size-4" />
                      </a>
                    </Button>
                  ) : (
                    <span
                      className="grid size-10 place-items-center rounded-md border text-muted-foreground"
                      title={club.telegramConfigured ? "Bot configuration pending" : "Telegram group not configured"}
                      aria-label={club.telegramConfigured ? "Bot configuration pending" : "Telegram group not configured"}
                    >
                      <Bot className="size-4" />
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : hasActiveFilters ? (
        <div className="surface rounded-xl px-6 py-20 text-center">
          <Search className="mx-auto size-5 text-muted-foreground" />
          <h2 className="mt-4 font-semibold">No clubs match these filters</h2>
          <p className="mt-1 text-sm text-muted-foreground">Try a broader search or another category.</p>
          <Button
            className="mt-5"
            variant="outline"
            onClick={() => { setQuery(""); setCategory("All"); }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="surface rounded-xl px-6 py-20 text-center">
          <Users className="mx-auto size-5 text-muted-foreground" />
          <h2 className="mt-4 font-semibold">No clubs yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {canCreate
              ? "Create the first student club when you are ready."
              : "Student clubs will appear here once organizers publish them."}
          </p>
          {canCreate && (
            <Button className="mt-5" asChild>
              <ClientNavLink href="/clubs/new">
                <Plus className="size-4" />
                Create club
              </ClientNavLink>
            </Button>
          )}
        </div>
      )}
    </>
  );
}
