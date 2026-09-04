import Link from "next/link";
import { Plus } from "lucide-react";
import { Brand } from "@/components/shared/brand";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";

export default function ClubsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center px-4 sm:px-6 lg:px-8">
          <Brand />
          <nav className="ms-auto hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
            <Link href="/clubs" className="hover:text-foreground">Clubs</Link>
            <Link href="/home" className="hover:text-foreground">QAIRU Hub</Link>
          </nav>
          <div className="ms-auto flex items-center gap-2 sm:ms-6">
            <ThemeToggle />
            <Button size="sm" asChild>
              <Link href="/clubs/new"><Plus className="size-4" /> Create club</Link>
            </Button>
          </div>
        </div>
      </header>
      {children}
      <footer className="mx-auto flex max-w-[1180px] flex-col gap-3 border-t px-4 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:px-6 lg:px-8">
        <span>QAIRU University Clubs + Telegram prototype</span>
        <span className="sm:ms-auto">Supabase is the shared source of truth.</span>
      </footer>
    </div>
  );
}
