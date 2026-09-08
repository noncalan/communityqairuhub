"use client";

import { LiveProjectDialog } from "@/components/social/live-create-dialogs";
import { useCurrentUser } from "@/lib/auth/current-user-provider";

export function HomeGreeting() {
  const { profile } = useCurrentUser();
  const firstName = profile.fullName.split(" ")[0];
  return (
    <section className="border-b pb-8">
      <p className="eyebrow">Live campus</p>
      <div className="mt-2 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
            Welcome back, {firstName}.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Everything below comes from your QAIRU Hub database.
          </p>
        </div>
        <LiveProjectDialog compact />
      </div>
    </section>
  );
}
