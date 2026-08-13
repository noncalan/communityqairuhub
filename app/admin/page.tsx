import Link from "next/link";
import { Construction } from "lucide-react";
import { notFound } from "next/navigation";
import { Brand } from "@/components/shared/brand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isLiveMode } from "@/lib/app-mode";

export default async function Page() {
  if (!isLiveMode) notFound();

  const { supabase, userId } = await getCurrentUser();
  if (!userId) notFound();

  const { data: role, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (error || !role) notFound();

  return (
    <div className="min-h-screen bg-[#0d1017] text-slate-100">
      <header className="flex h-16 items-center border-b border-white/10 px-6">
        <Brand />
        <Badge className="ms-3 bg-white/10 text-slate-300">Admin</Badge>
        <Link
          href="/home"
          className="ms-auto text-xs text-slate-400 hover:text-white"
        >
          Return to Hub
        </Link>
      </header>
      <main className="mx-auto flex max-w-3xl flex-col items-center px-5 py-24 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-white/5 text-slate-400">
          <Construction className="size-5" />
        </span>
        <p className="mt-6 text-[10px] uppercase tracking-[.15em] text-slate-500">
          Intentional Preview placeholder
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-.04em]">
          Admin tooling is not live yet
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-slate-400">
          Access control is active, but operational dashboards and moderation
          workflows are outside this Preview phase. No illustrative platform
          metrics or queue items are presented as real data.
        </p>
        <Button asChild variant="outline" className="mt-8">
          <Link href="/home">Back to Hub</Link>
        </Button>
      </main>
    </div>
  );
}
