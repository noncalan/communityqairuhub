import { Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ClientBrand } from "@/components/shared/client-brand";
import { ClientNavLink } from "@/components/shared/client-nav-link";
import { RouteDataSkeleton } from "@/components/shared/route-data-skeleton";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { isLiveMode } from "@/lib/app-mode";
import { getCurrentProfileGate } from "@/lib/auth/current-user";

export default function ClubsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center px-4 sm:px-6 lg:px-8">
          <ClientBrand />
          <nav className="ms-auto hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
            <ClientNavLink href="/clubs" className="hover:text-foreground">Clubs</ClientNavLink>
            <ClientNavLink href="/home" className="hover:text-foreground">QAIRU Hub</ClientNavLink>
          </nav>
          <div className="ms-auto flex items-center gap-2 sm:ms-6">
            <ThemeToggle />
            <Button size="sm" asChild>
              <ClientNavLink href="/clubs/new"><Plus className="size-4" /> Create club</ClientNavLink>
            </Button>
          </div>
        </div>
      </header>
      <Suspense fallback={<ClubsContentFallback />}>
        <ClubsAccessGate>{children}</ClubsAccessGate>
      </Suspense>
      <footer className="mx-auto flex max-w-[1180px] flex-col gap-3 border-t px-4 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:px-6 lg:px-8">
        <span>QAIRU University Clubs + Telegram prototype</span>
        <span className="sm:ms-auto">Supabase is the shared source of truth.</span>
      </footer>
    </div>
  );
}

async function ClubsAccessGate({ children }: { children: React.ReactNode }) {
  if (isLiveMode) {
    const current = await getCurrentProfileGate();
    if (current.userId && !current.onboardingCompleted) redirect("/onboarding");
  }
  return children;
}

function ClubsContentFallback() {
  return (
    <div className="page-container" aria-label="Loading clubs">
      <div className="h-3 w-32 animate-pulse rounded bg-muted" />
      <div className="mt-4 h-10 w-64 animate-pulse rounded bg-muted" />
      <RouteDataSkeleton label="Loading clubs" />
    </div>
  );
}
