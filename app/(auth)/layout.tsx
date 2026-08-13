import Link from "next/link";
import { isLiveMode } from "@/lib/app-mode";
import { Brand } from "@/components/shared/brand";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_0.75fr]">
      <div className="flex min-h-screen flex-col">
        <header className="flex h-16 items-center px-5 sm:px-8">
          <Brand />
          <div className="ms-auto">
            <ThemeToggle />
          </div>
        </header>
        <main className="grid flex-1 place-items-center px-5 py-10">
          {children}
        </main>
        <footer className="px-8 py-5 text-xs text-muted-foreground">
          Independent student platform for QAIRU
        </footer>
      </div>
      <aside className="relative hidden overflow-hidden border-s bg-foreground p-12 text-background lg:flex lg:flex-col">
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:38px_38px]" />
        <div className="relative mt-auto">
          <p className="text-xs uppercase tracking-[0.16em] opacity-60">
            QAIRU Hub
          </p>
          {isLiveMode ? (
            <>
              <h2 className="mt-5 max-w-lg text-3xl font-medium leading-tight tracking-[-0.04em]">
                Your real campus activity, in one trusted place.
              </h2>
              <p className="mt-6 max-w-md text-sm leading-6 opacity-65">
                Sign in to access member-contributed profiles, communities,
                projects, events and conversations.
              </p>
            </>
          ) : (
            <>
              <blockquote className="mt-5 max-w-lg text-3xl font-medium leading-tight tracking-[-0.04em]">
                “I found the team for our first campus project in one afternoon.”
              </blockquote>
              <p className="mt-6 text-sm opacity-65">
                Illustrative demo testimonial
              </p>
            </>
          )}
          <Link
            href="/"
            className="relative mt-12 inline-flex items-center gap-2 text-sm font-medium underline-offset-4 hover:underline"
          >
            About QAIRU Hub →
          </Link>
        </div>
      </aside>
    </div>
  );
}
