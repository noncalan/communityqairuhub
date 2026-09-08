import { ClientNavLink } from "@/components/shared/client-nav-link";
import { ArrowRight, Users } from "lucide-react";
import type { Project } from "@/types";
import { Badge } from "@/components/ui/badge";

const statusStyle = { Idea:"bg-amber-500/10 text-amber-700 dark:text-amber-400", Building:"bg-blue-500/10 text-blue-700 dark:text-blue-400", Launched:"bg-emerald-500/10 text-emerald-700 dark:text-emerald-400", Completed:"bg-muted text-muted-foreground" };
export function ProjectRow({ project }: { project: Project }) {
  return <article className="group border-b py-6 first:pt-0 last:border-0"><div className="grid gap-4 md:grid-cols-[1fr_240px_auto] md:items-center">
    <div><div className="mb-2 flex items-center gap-2"><Badge variant="secondary" className={statusStyle[project.status]}>{project.status}</Badge><span className="text-xs text-muted-foreground">{project.category}</span></div><ClientNavLink href={`/projects/${project.slug}`} className="text-lg font-semibold tracking-[-0.03em] hover:text-primary">{project.name}</ClientNavLink><p className="mt-1 text-sm text-muted-foreground">{project.tagline}</p></div>
    <div><p className="eyebrow mb-2">Looking for</p><p className="line-clamp-2 text-xs leading-5 text-muted-foreground">{project.lookingFor.length ? project.lookingFor.join(" · ") : "Team complete"}</p></div>
    <div className="flex items-center gap-3"><span className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="size-3.5"/>{project.members.length}</span><ClientNavLink href={`/projects/${project.slug}`} aria-label={`View ${project.name}`} className="rounded-md border p-2 transition-colors group-hover:bg-foreground group-hover:text-background"><ArrowRight className="size-4"/></ClientNavLink></div>
  </div></article>;
}
