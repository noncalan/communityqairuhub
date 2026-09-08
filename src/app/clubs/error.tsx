"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ClubsError({ reset }: { reset: () => void }) {
  return (
    <div className="page-container py-24 text-center">
      <AlertTriangle className="mx-auto size-6 text-destructive" />
      <h1 className="mt-4 text-2xl font-semibold">The club directory is temporarily unavailable</h1>
      <p className="mt-2 text-sm text-muted-foreground">No demo records are substituted for live club data.</p>
      <Button className="mt-6" variant="outline" onClick={reset}>Try again</Button>
    </div>
  );
}
