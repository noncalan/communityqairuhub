"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DemoStateProvider } from "@/lib/demo/demo-store";

export function Providers({
  children,
  nonce,
}: {
  children: React.ReactNode;
  nonce?: string;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      nonce={nonce}
    >
      <DemoStateProvider>
        <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
      </DemoStateProvider>
      <Toaster position="bottom-right" richColors />
    </ThemeProvider>
  );
}
