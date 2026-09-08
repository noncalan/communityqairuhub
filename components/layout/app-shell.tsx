"use client";

import { LogOut, Menu, Settings, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ClientBrand } from "@/components/shared/client-brand";
import { ClientNavLink } from "@/components/shared/client-nav-link";
import { CommandSearch } from "@/components/shared/command-search";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { AvatarMark } from "@/components/shared/avatar-mark";
import { NavItems } from "@/components/layout/nav-items";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { isLiveMode } from "@/lib/app-mode";
import { authService } from "@/lib/auth/service";
import { useCurrentUser } from "@/lib/auth/current-user-provider";
import { useDemoState } from "@/lib/demo/demo-store";

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-[220px] border-e bg-sidebar/90 lg:flex lg:flex-col">
        <div className="px-5 py-5"><ClientBrand /></div>
        <div className="px-3"><CommandSearch /></div>
        <div className="flex-1 overflow-y-auto px-3 py-5"><NavItems /></div>
        {isLiveMode ? <LiveAccountMenu /> : <DemoAccountCard />}
      </aside>
      <header className="sticky top-0 z-20 flex h-14 items-center border-b bg-background/90 px-4 backdrop-blur lg:ms-[220px] lg:px-7">
        <div className="lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button size="icon" variant="ghost" aria-label="Open navigation"><Menu className="size-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[290px] p-4">
              <SheetHeader className="text-start"><SheetTitle><ClientBrand /></SheetTitle></SheetHeader>
              <div className="mt-6">
                <CommandSearch listenShortcut={false} />
                <div className="mt-5"><NavItems mobile onNavigate={() => setOpen(false)} /></div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <div className="ms-2 lg:hidden"><ClientBrand /></div>
        <div className="ms-auto flex items-center gap-1">
          <div className="sm:hidden"><CommandSearch compact listenShortcut={false} /></div>
          <ThemeToggle />
          {isLiveMode ? <LiveAccountMenu compact /> : <DemoAccountMenu />}
        </div>
      </header>
      <main className="lg:ms-[220px]">{children}</main>
    </div>
  );
}

function DemoAccountCard() {
  const { state } = useDemoState();
  return (
    <ClientNavLink href={`/u/${state.profile.username}`} className="m-3 flex items-center gap-3 rounded-lg border bg-background p-2.5 transition-colors hover:bg-accent">
      <AvatarMark initials={initials(state.profile.name)} color="#4f5fc4" className="size-8" />
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold">{state.profile.name}</p>
        <p className="truncate text-[11px] text-muted-foreground">{state.profile.program} · Year {state.profile.year}</p>
      </div>
    </ClientNavLink>
  );
}

function DemoAccountMenu() {
  const { state } = useDemoState();
  return (
    <ClientNavLink href={`/u/${state.profile.username}`} aria-label="Open your profile">
      <AvatarMark initials={initials(state.profile.name)} color="#4f5fc4" className="size-8" />
    </ClientNavLink>
  );
}

function LiveAccountMenu({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const { profile } = useCurrentUser();
  async function signOut() {
    const { error } = await authService.signOut();
    if (error) return toast.error("Could not sign out. Please try again.");
    router.replace("/login");
    router.refresh();
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {compact ? (
          <Button variant="ghost" size="icon" aria-label="Open account menu">
            <AvatarMark initials={initials(profile.fullName)} color="#4f5fc4" className="size-8" />
          </Button>
        ) : (
          <button className="m-3 flex items-center gap-3 rounded-lg border bg-background p-2.5 text-start transition-colors hover:bg-accent">
            <AvatarMark initials={initials(profile.fullName)} color="#4f5fc4" className="size-8" />
            <span className="min-w-0">
              <span className="block truncate text-xs font-semibold">{profile.fullName}</span>
              <span className="block truncate text-[11px] text-muted-foreground">{profile.program} · Year {profile.academicYear}</span>
            </span>
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={compact ? "end" : "start"} className="w-56">
        <DropdownMenuLabel>
          <span className="block truncate">{profile.fullName}</span>
          <span className="block truncate text-xs font-normal text-muted-foreground">@{profile.username}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push(`/u/${profile.username}`)}>
          <UserRound className="size-4" /> Profile
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push("/settings")}>
          <Settings className="size-4" /> Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={signOut}>
          <LogOut className="size-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
