import { Suspense } from "react";
import { ArrowRight, CalendarDays, FolderKanban, Sparkles } from "lucide-react";
import { HomeGreeting } from "@/components/home/home-greeting";
import { ClientNavLink } from "@/components/shared/client-nav-link";
import { LiveEventDialog, LiveProjectDialog } from "@/components/social/live-create-dialogs";
import { LivePostFeed } from "@/components/posts/live-post-feed";
import { Badge } from "@/components/ui/badge";
import type { HomeCommunity, HomeEvent, HomeProject } from "@/lib/data/home";
import type { LivePost } from "@/lib/data/posts";

type LiveHomeProps = {
  currentUserId: string;
  communities: Promise<HomeCommunity[]>;
  projects: Promise<HomeProject[]>;
  events: Promise<HomeEvent[]>;
  feed: Promise<LivePost[]>;
};

export function LiveHome({ currentUserId, communities, projects, events, feed }: LiveHomeProps) {
  return (
    <div className="page-container">
      <div className="grid gap-10 xl:grid-cols-[1fr_290px]">
        <div>
          <HomeGreeting />
          <Suspense fallback={<HomeBlockFallback className="my-8 h-28" />}>
            <HomeMetrics communities={communities} projects={projects} events={events} />
          </Suspense>
          <Suspense fallback={<HomeBlockFallback className="h-72" />}>
            <HomeProjects projects={projects} />
          </Suspense>
          <Suspense fallback={<HomeBlockFallback className="mt-10 h-80" />}>
            <HomeFeedSection communities={communities} currentUserId={currentUserId} feed={feed} />
          </Suspense>
        </div>
        <aside className="space-y-8">
          <Suspense fallback={<HomeBlockFallback className="h-52" />}>
            <HomeEvents events={events} />
          </Suspense>
          <Suspense fallback={<HomeBlockFallback className="h-52" />}>
            <HomeCommunities communities={communities} />
          </Suspense>
          <section className="rounded-lg bg-foreground p-5 text-background">
            <p className="text-[10px] uppercase tracking-[.15em] opacity-55">Quick action</p>
            <h3 className="mt-4 font-semibold">Start a campus moment</h3>
            <p className="mt-2 text-xs leading-5 opacity-65">Create a real event with database-enforced capacity.</p>
            <div className="mt-5"><LiveEventDialog dark /></div>
          </section>
        </aside>
      </div>
    </div>
  );
}

async function HomeMetrics({ communities, projects, events }: Pick<LiveHomeProps, "communities" | "projects" | "events">) {
  const [communityItems, projectItems, eventItems] = await Promise.all([communities, projects, events]);
  const upcomingCount = eventItems.filter((event) => new Date(event.endsAt) >= new Date()).length;
  return (
    <section className="py-8">
      <div className="grid overflow-hidden rounded-lg border bg-border sm:grid-cols-3 sm:gap-px">
        <Metric label="Communities" value={communityItems.length} href="/communities" icon={Sparkles} />
        <Metric label="Projects" value={projectItems.length} href="/projects" icon={FolderKanban} />
        <Metric label="Upcoming events" value={upcomingCount} href="/events" icon={CalendarDays} />
      </div>
    </section>
  );
}

async function HomeProjects({ projects }: Pick<LiveHomeProps, "projects">) {
  const items = await projects;
  return (
    <section>
      <div className="mb-4 flex items-end justify-between">
        <div><p className="eyebrow">Build together</p><h2 className="mt-1 text-xl font-semibold tracking-[-0.03em]">Latest projects</h2></div>
        <ClientNavLink href="/projects" className="text-xs text-muted-foreground hover:text-foreground">View all →</ClientNavLink>
      </div>
      {items.length ? (
        <div className="surface divide-y rounded-lg">
          {items.slice(0, 5).map((project) => (
            <ClientNavLink key={project.id} href={`/projects/${project.slug}`} className="group flex items-center gap-4 p-5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-sm font-semibold group-hover:text-primary">{project.name}</h3>
                  <Badge variant="secondary" className="capitalize">{project.status}</Badge>
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">{project.tagline}</p>
              </div>
              <span className="hidden text-xs text-muted-foreground sm:block">{project.memberCount} team members</span>
              <ArrowRight className="size-4 text-muted-foreground" />
            </ClientNavLink>
          ))}
        </div>
      ) : (
        <div className="surface rounded-lg border-dashed p-10 text-center">
          <h3 className="font-semibold">No live projects yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">Publish the first brief and recruit collaborators.</p>
          <div className="mt-5"><LiveProjectDialog compact /></div>
        </div>
      )}
    </section>
  );
}

async function HomeFeedSection({ communities, currentUserId, feed }: Pick<LiveHomeProps, "communities" | "currentUserId" | "feed">) {
  const [communityItems, posts] = await Promise.all([communities, feed]);
  const joinedCommunities = communityItems
    .filter((community) => community.currentRole !== null)
    .map(({ id, slug, name }) => ({ id, slug, name }));
  return (
    <div className="mt-10 border-t pt-8">
      <LivePostFeed
        initialPosts={posts}
        communities={joinedCommunities}
        currentUserId={currentUserId}
        emptyTitle="Your live feed is ready"
        emptyDescription="Follow people, join communities or publish the first campus update. No fictional activity is inserted."
      />
    </div>
  );
}

async function HomeEvents({ events }: Pick<LiveHomeProps, "events">) {
  const upcoming = (await events).filter((event) => new Date(event.endsAt) >= new Date()).slice(0, 4);
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <p className="eyebrow">Upcoming</p>
        <ClientNavLink href="/events" className="text-xs text-muted-foreground hover:text-foreground">Calendar →</ClientNavLink>
      </div>
      {upcoming.length ? (
        <div className="surface rounded-lg p-4">
          {upcoming.map((event) => {
            const date = new Date(event.startsAt);
            return (
              <ClientNavLink key={event.id} href={`/events/${event.slug}`} className="flex gap-3 border-b py-3 first:pt-0 last:border-0 last:pb-0">
                <div className="w-9 text-center">
                  <p className="text-[9px] font-semibold text-primary">{date.toLocaleDateString("en", { month: "short" }).toUpperCase()}</p>
                  <p className="font-mono text-base font-semibold">{date.getDate()}</p>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium leading-5">{event.title}</p>
                  <p className="text-[11px] text-muted-foreground">{date.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              </ClientNavLink>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">No upcoming events.</div>
      )}
    </section>
  );
}

async function HomeCommunities({ communities }: Pick<LiveHomeProps, "communities">) {
  const items = await communities;
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <p className="eyebrow">Communities</p>
        <ClientNavLink href="/communities" className="text-xs text-muted-foreground hover:text-foreground">Explore →</ClientNavLink>
      </div>
      {items.length ? (
        <div className="space-y-2">
          {items.slice(0, 4).map((community) => (
            <ClientNavLink href={`/communities/${community.slug}`} key={community.id} className="surface flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-accent">
              <span className="size-2 rounded-full bg-primary" />
              <div className="min-w-0">
                <p className="truncate text-xs font-medium">{community.name}</p>
                <p className="text-[11px] text-muted-foreground">{community.memberCount} members · {community.status}</p>
              </div>
              <ArrowRight className="ms-auto size-3.5 text-muted-foreground" />
            </ClientNavLink>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed p-5 text-center text-xs text-muted-foreground">No live communities yet.</p>
      )}
    </section>
  );
}

function Metric({ label, value, href, icon: Icon }: { label: string; value: number; href: string; icon: typeof Sparkles }) {
  return (
    <ClientNavLink href={href} className="group bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[.13em] text-muted-foreground">{label}</p>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <p className="mt-5 text-3xl font-semibold tracking-[-0.04em]">{value}</p>
      <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">Explore <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" /></p>
    </ClientNavLink>
  );
}

function HomeBlockFallback({ className }: { className: string }) {
  return <div aria-hidden className={`animate-pulse rounded-lg bg-muted/60 ${className}`} />;
}
