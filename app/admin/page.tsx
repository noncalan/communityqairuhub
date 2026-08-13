import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  FileText,
  FolderKanban,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Brand } from "@/components/shared/brand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isLiveMode } from "@/lib/app-mode";

const metrics = [
  [Users, "Users", "1,284", "+8.2%"],
  [Sparkles, "Communities", "42", "+3"],
  [FileText, "Posts", "3,892", "+12.1%"],
  [FolderKanban, "Projects", "186", "+14"],
] as const;

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
      <main className="mx-auto max-w-7xl px-5 py-8">
        <p className="text-[10px] uppercase tracking-[.15em] text-slate-500">
          Platform operations
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-.04em]">
          Overview
        </h1>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map(([Icon, label, value, change]) => (
            <div
              key={label}
              className="rounded-lg border border-white/10 bg-white/[.035] p-5"
            >
              <div className="flex justify-between">
                <Icon className="size-4 text-slate-500" />
                <span className="text-[10px] text-emerald-400">{change}</span>
              </div>
              <p className="mt-8 text-2xl font-semibold">{value}</p>
              <p className="mt-1 text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_340px]">
          <section className="rounded-lg border border-white/10">
            <div className="flex items-center border-b border-white/10 p-4">
              <h2 className="text-sm font-semibold">Moderation queue</h2>
              <Badge className="ms-2 bg-amber-400/10 text-amber-300">
                7 open
              </Badge>
              <Button variant="ghost" size="sm" className="ms-auto text-slate-300">
                View all
              </Button>
            </div>
            {[
              "Reported post in Startup Club",
              "Community verification: Quantum Society",
              "Event announcement awaiting approval",
              "User appeal #QA-184",
            ].map((item, index) => (
              <div
                key={item}
                className="flex items-center gap-3 border-b border-white/10 p-4 last:border-0"
              >
                <span
                  className={`grid size-8 place-items-center rounded ${
                    index === 0
                      ? "bg-amber-400/10 text-amber-300"
                      : "bg-white/5 text-slate-400"
                  }`}
                >
                  {index === 0 ? (
                    <AlertTriangle className="size-4" />
                  ) : (
                    <ShieldCheck className="size-4" />
                  )}
                </span>
                <div>
                  <p className="text-xs font-medium">{item}</p>
                  <p className="mt-1 text-[10px] text-slate-500">
                    Submitted {index + 1}h ago
                  </p>
                </div>
                <ArrowUpRight className="ms-auto size-4 text-slate-500" />
              </div>
            ))}
          </section>
          <aside className="rounded-lg border border-white/10 bg-white/[.035] p-5">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">
              Platform status
            </p>
            <div className="mt-5 space-y-4">
              {["Database", "Auth", "Realtime", "Storage"].map((service) => (
                <div key={service} className="flex justify-between text-xs">
                  <span className="text-slate-400">{service}</span>
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <span className="size-1.5 rounded-full bg-current" />
                    Operational
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6 border-t border-white/10 pt-5">
              <p className="flex items-center gap-2 text-xs">
                <CalendarDays className="size-4 text-slate-500" />
                18 upcoming events
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
