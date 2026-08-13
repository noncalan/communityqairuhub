"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Bookmark, CalendarDays, MapPin, Search, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { LiveCommunity, LiveEvent, LiveProject } from "@/lib/data/social";

function DirectoryShell({
  query,
  setQuery,
  resultCount,
  children,
}: {
  query: string;
  setQuery: (value: string) => void;
  resultCount: number;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="mb-7 flex items-center gap-3 border-y py-4">
        <div className="relative max-w-xl flex-1">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} className="ps-9 shadow-none" placeholder="Search by name, category or topic" />
        </div>
        <span className="text-xs text-muted-foreground">{resultCount} results</span>
      </div>
      {children}
    </>
  );
}

function Empty({ title, description, query, clear }: { title: string; description: string; query: string; clear: () => void }) {
  return (
    <div className="surface rounded-lg border-dashed py-20 text-center">
      <Search className="mx-auto size-5 text-muted-foreground" />
      <h2 className="mt-4 font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      {query && <Button className="mt-5" variant="outline" onClick={clear}>Clear search</Button>}
    </div>
  );
}

export function LiveCommunityDirectory({ communities }: { communities: LiveCommunity[] }) {
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query.trim().toLowerCase());
  const filtered = useMemo(() => communities.filter((item) =>
    [item.name, item.category, item.description].join(" ").toLowerCase().includes(deferred),
  ), [communities, deferred]);
  return (
    <DirectoryShell query={query} setQuery={setQuery} resultCount={filtered.length}>
      {filtered.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((community) => (
        <Link key={community.id} href={`/communities/${community.slug}`} className="group surface block rounded-lg p-5 transition-transform hover:-translate-y-0.5">
          <div className="flex items-start justify-between gap-3"><span className="eyebrow">{community.category}</span><Badge variant="secondary" className="capitalize">{community.status}</Badge></div>
          <h2 className="mt-5 text-lg font-semibold tracking-[-0.03em] group-hover:text-primary">{community.name}</h2>
          <p className="mt-2 line-clamp-3 min-h-15 text-sm leading-5 text-muted-foreground">{community.description}</p>
          <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground"><Users className="size-3.5" />{community.memberCount} {community.memberCount === 1 ? "member" : "members"}{community.currentRole && <Badge variant="outline" className="ms-auto capitalize">{community.currentRole}</Badge>}</div>
        </Link>
      ))}</div> : <Empty title={query ? "No communities matched" : "Start the first community"} description={query ? "Try a broader topic or category." : "Live communities will appear here as students create them."} query={query} clear={() => setQuery("")} />}
    </DirectoryShell>
  );
}

export function LiveProjectDirectory({ projects }: { projects: LiveProject[] }) {
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query.trim().toLowerCase());
  const filtered = useMemo(() => projects.filter((item) =>
    [item.name, item.tagline, item.description, item.category, ...item.technologies, ...item.roles.map((role) => role.title)].join(" ").toLowerCase().includes(deferred),
  ), [deferred, projects]);
  return (
    <DirectoryShell query={query} setQuery={setQuery} resultCount={filtered.length}>
      {filtered.length ? <div className="surface divide-y rounded-lg px-5 sm:px-6">{filtered.map((project) => (
        <article key={project.id} className="grid gap-4 py-6 md:grid-cols-[1fr_240px_auto] md:items-center">
          <div><div className="mb-2 flex items-center gap-2"><Badge variant="secondary" className="capitalize">{project.status}</Badge><span className="text-xs text-muted-foreground">{project.category}</span>{project.isSaved && <Bookmark className="size-3.5 fill-current text-primary" aria-label="Saved" />}</div><Link href={`/projects/${project.slug}`} className="text-lg font-semibold tracking-[-0.03em] hover:text-primary">{project.name}</Link><p className="mt-1 text-sm text-muted-foreground">{project.tagline}</p></div>
          <div><p className="eyebrow mb-2">Open roles</p><p className="line-clamp-2 text-xs leading-5 text-muted-foreground">{project.roles.filter((role) => role.isOpen).map((role) => role.title).join(" · ") || "Team complete"}</p></div>
          <div className="flex items-center gap-3"><span className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="size-3.5" />{project.memberCount}</span><Button asChild size="icon" variant="outline"><Link href={`/projects/${project.slug}`} aria-label={`View ${project.name}`}><ArrowRight className="size-4" /></Link></Button></div>
        </article>
      ))}</div> : <Empty title={query ? "No projects matched" : "Publish the first project"} description={query ? "Try a different skill, role or category." : "Real student projects and their open roles will appear here."} query={query} clear={() => setQuery("")} />}
    </DirectoryShell>
  );
}

export function LiveEventDirectory({ events }: { events: LiveEvent[] }) {
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query.trim().toLowerCase());
  const filtered = useMemo(() => events.filter((item) =>
    [item.title, item.description, item.category, item.location, item.organizer.fullName].join(" ").toLowerCase().includes(deferred),
  ), [deferred, events]);
  return (
    <DirectoryShell query={query} setQuery={setQuery} resultCount={filtered.length}>
      {filtered.length ? <div className="surface divide-y rounded-lg px-5 sm:px-6">{filtered.map((event) => {
        const start = new Date(event.startsAt);
        return <article key={event.id} className="grid grid-cols-[54px_1fr] gap-4 py-5 sm:grid-cols-[64px_1fr_auto] sm:items-center">
          <div className="rounded-md border bg-muted/40 py-2 text-center"><div className="text-[10px] font-semibold tracking-widest text-primary">{start.toLocaleDateString("en", { month: "short" }).toUpperCase()}</div><div className="font-mono text-xl font-semibold">{String(start.getDate()).padStart(2, "0")}</div></div>
          <div><div className="mb-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground"><span>{event.category}</span><span>·</span><span>{start.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}</span>{event.isSaved && <Bookmark className="size-3 fill-current text-primary" />}</div><Link href={`/events/${event.slug}`} className="font-semibold tracking-[-0.02em] hover:text-primary">{event.title}</Link><p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" />{event.location} · {event.organizer.fullName}</p><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><CalendarDays className="size-3" />{event.attendeeCount} / {event.capacity} attending</p></div>
          <Button asChild size="icon" variant="outline" className="col-start-2 sm:col-auto"><Link href={`/events/${event.slug}`} aria-label={`View ${event.title}`}><ArrowRight className="size-4" /></Link></Button>
        </article>;
      })}</div> : <Empty title={query ? "No events matched" : "Create the first event"} description={query ? "Try a broader title, place or category." : "Upcoming live events will appear here without demo content."} query={query} clear={() => setQuery("")} />}
    </DirectoryShell>
  );
}
