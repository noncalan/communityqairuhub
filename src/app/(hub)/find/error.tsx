"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function FindError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Team Finder failed to load", error);
  }, [error]);

  return (
    <div className="page-container">
      <div className="surface rounded-xl px-6 py-20 text-center" role="alert">
        <h1 className="text-xl font-semibold">Team Finder could not load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account and data were not changed. Try loading the results again.
        </p>
        <Button className="mt-5" onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
