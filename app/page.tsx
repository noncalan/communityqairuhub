import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  FolderKanban,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { AvatarMark } from "@/components/shared/avatar-mark";
import { Brand } from "@/components/shared/brand";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { isLiveMode } from "@/lib/app-mode";
import { events, projects, students } from "@/lib/data/mock";

const navigationItems = [
  [Sparkles, "Today"],
  [Users, "People"],
  [FolderKanban, "Projects"],
  [CalendarDays, "Events"],
] as const;

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-background">
      <header className="mx-auto flex h-16 max-w-[1180px] items-center px-4 sm:px-6 lg:px-8">
        <Brand />
        <nav className="ms-auto hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <a href="#inside" className="hover:text-foreground">
            Inside the Hub
          </a>
          <Link href="/people" className="hover:text-foreground">
            People
          </Link>
          <Link href="/events" className="hover:text-foreground">
            Events
          </Link>
          <Link href="/clubs" className="hover:text-foreground">
            Clubs
          </Link>
        </nav>
        <div className="ms-auto flex items-center gap-2 md:ms-7">
          <ThemeToggle />
          <Button variant="ghost" asChild>
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-[1180px] gap-12 px-4 pb-20 pt-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8 lg:pb-28 lg:pt-28">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs text-muted-foreground">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Independent student platform for QAIRU
            </p>
            <h1 className="text-balance text-5xl font-semibold leading-[0.98] tracking-[-0.06em] sm:text-6xl lg:text-[68px]">
              Everything happening at QAIRU.{" "}
              <span className="text-muted-foreground">In one place.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-muted-foreground">
              Discover people, communities, projects, events and opportunities
              across QAIRU.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/home">
                  Explore QAIRU Hub <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/clubs">Browse clubs</Link>
              </Button>
            </div>
            {isLiveMode ? <LiveTrustNote /> : <DemoTrustNote />}
          </div>

          <div className="relative">
            <div className="absolute -inset-10 -z-10 bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--primary)_12%,transparent),transparent_68%)]" />
            <div className="surface overflow-hidden rounded-xl">
              <PreviewChrome />
              <div className="grid min-h-[430px] grid-cols-[138px_1fr]">
                <PreviewNavigation />
                {isLiveMode ? <LivePreview /> : <DemoPreview />}
              </div>
            </div>
          </div>
        </section>

        <section id="inside" className="border-y bg-card">
          <div className="mx-auto max-w-[1180px] px-4 py-20 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr]">
              <div>
                <p className="eyebrow">One campus, connected</p>
                <h2 className="mt-3 max-w-sm text-3xl font-semibold tracking-[-0.045em]">
                  Help shape the traditions people will know QAIRU for.
                </h2>
                <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
                  QAIRU Hub connects the university&apos;s founding cohort around
                  early projects, communities and campus life.
                </p>
              </div>
              <div className="grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2">
                <Feature
                  icon={Users}
                  title="People"
                  text="Profiles built from real student skills and interests"
                  href="/people"
                />
                <Feature
                  icon={Sparkles}
                  title="Communities"
                  text="Student-led spaces forming their first traditions"
                  href="/communities"
                />
                <Feature
                  icon={FolderKanban}
                  title="Projects"
                  text={
                    isLiveMode
                      ? "Real ideas and teams shared by QAIRU members"
                      : `${projects.length} early ideas and teams building in public`
                  }
                  href="/projects"
                />
                <Feature
                  icon={CalendarDays}
                  title="Events"
                  text={
                    isLiveMode
                      ? "Real campus activities shared by QAIRU members"
                      : `${events.length} upcoming ways to take part`
                  }
                  href="/events"
                />
                <Feature
                  icon={Building2}
                  title="Clubs + Telegram"
                  text="Public club management backed by one shared Supabase source"
                  href="/clubs"
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-[1180px] flex-col gap-4 px-4 py-10 text-xs text-muted-foreground sm:flex-row sm:items-center sm:px-6 lg:px-8">
        <Brand />
        <p className="sm:ms-auto">
          Independent student platform for QAIRU · 2026
        </p>
      </footer>
    </div>
  );
}

function LiveTrustNote() {
  return (
    <div className="mt-12 flex items-center gap-4">
      <div className="grid size-8 place-items-center rounded-full border bg-card text-xs font-semibold text-primary">
        Q
      </div>
      <p className="text-xs leading-5 text-muted-foreground">
        <strong className="text-foreground">Live QAIRU data</strong>
        <br />
        Sign in to see member-contributed campus activity.
      </p>
    </div>
  );
}

function DemoTrustNote() {
  return (
    <div className="mt-12 flex items-center gap-4">
      <div className="flex -space-x-2">
        {students.slice(0, 4).map((student) => (
          <AvatarMark
            key={student.username}
            initials={student.initials}
            color={student.color}
            className="size-8 border-2 border-background"
          />
        ))}
      </div>
      <p className="text-xs leading-5 text-muted-foreground">
        <strong className="text-foreground">Demo experience</strong>
        <br />
        Illustrative projects, clubs and people.
      </p>
    </div>
  );
}

function PreviewChrome() {
  return (
    <div className="flex h-12 items-center gap-3 border-b px-4">
      <div className="flex gap-1.5">
        <span className="size-2.5 rounded-full bg-border" />
        <span className="size-2.5 rounded-full bg-border" />
        <span className="size-2.5 rounded-full bg-border" />
      </div>
      <div className="mx-auto flex h-7 w-60 items-center rounded-md border bg-muted/40 px-3 text-[11px] text-muted-foreground">
        <Search className="me-2 size-3" />
        Search QAIRU
        <span className="ms-auto font-mono">⌘K</span>
      </div>
    </div>
  );
}

function PreviewNavigation() {
  return (
    <div className="border-e bg-muted/20 p-3">
      <div className="mb-6 flex items-center gap-2 px-1">
        <span className="grid size-6 place-items-center rounded-md bg-primary text-[10px] font-bold text-primary-foreground">
          Q
        </span>
        <span className="text-xs font-semibold">QAIRU Hub</span>
      </div>
      {navigationItems.map(([Icon, label], index) => (
        <div
          key={label}
          className={`mb-1 flex items-center gap-2 rounded px-2 py-2 text-[11px] ${
            index === 0
              ? "bg-primary/10 font-medium text-primary"
              : "text-muted-foreground"
          }`}
        >
          <Icon className="size-3.5" />
          {label}
        </div>
      ))}
    </div>
  );
}

function LivePreview() {
  return (
    <div className="flex flex-col justify-center p-5 sm:p-7">
      <p className="eyebrow">Live Preview</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
        Your campus starts here
      </h2>
      <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
        Sign in to see real profiles, projects, events and community activity
        shared inside QAIRU Hub.
      </p>
      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border p-4">
          <Users className="size-4 text-primary" />
          <p className="mt-4 text-sm font-semibold">Find your people</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Search members by real skills and interests.
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <Sparkles className="size-4 text-primary" />
          <p className="mt-4 text-sm font-semibold">Join campus life</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Follow activity contributed by QAIRU members.
          </p>
        </div>
      </div>
    </div>
  );
}

function DemoPreview() {
  return (
    <div className="p-5 sm:p-7">
      <p className="eyebrow">Demo · Thursday · August 13</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
        Good afternoon, Aruzhan
      </h2>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border bg-primary p-4 text-primary-foreground">
          <p className="text-[10px] uppercase tracking-widest opacity-70">
            Next up · 18:30
          </p>
          <p className="mt-4 font-semibold">AI Build Night</p>
          <p className="mt-1 text-xs opacity-75">Lab 3.12 · 42 going</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Project match
          </p>
          <p className="mt-4 font-semibold">Open Campus Map</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Looking for GIS contributors
          </p>
        </div>
      </div>
      <div className="mt-6">
        <p className="eyebrow mb-3">Illustrative community post</p>
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2">
            <AvatarMark initials="TS" color="#85629a" className="size-7" />
            <div>
              <p className="text-xs font-medium">Temirlan Sadyk</p>
              <p className="text-[10px] text-muted-foreground">
                AI &amp; Machine Learning · 18 min
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-5">
            Shared a first version of the Kazakh NLP dataset directory.
            Contributions and missing sources are welcome.
          </p>
        </div>
      </div>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  text,
  href,
}: {
  icon: typeof Users;
  title: string;
  text: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group bg-card p-6 transition-colors hover:bg-accent"
    >
      <Icon className="size-5 text-primary" />
      <h3 className="mt-8 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
      <ArrowRight className="mt-5 size-4 transition-transform group-hover:translate-x-1" />
    </Link>
  );
}
