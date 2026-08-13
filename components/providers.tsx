"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DemoStateProvider } from "@/lib/demo/demo-store";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <DemoStateProvider><TooltipProvider delayDuration={300}>{children}</TooltipProvider></DemoStateProvider>
      <Toaster position="bottom-right" richColors />
    </ThemeProvider>
  );
}
