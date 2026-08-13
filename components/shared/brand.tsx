import Link from "next/link";
import { cn } from "@/lib/utils";

export function Brand({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", className)}>
      <span className="grid size-8 place-items-center rounded-lg bg-primary text-sm font-bold tracking-[-0.08em] text-primary-foreground">Q</span>
      {!compact && <span className="text-[15px] font-semibold tracking-[-0.025em]">QAIRU Hub</span>}
    </Link>
  );
}
