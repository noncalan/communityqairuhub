"use client";

import { ArrowRight, BriefcaseBusiness, Search, Users } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { ClientNavLink } from "@/components/shared/client-nav-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  ProjectOpportunity,
  ProjectOpportunityState,
} from "@/lib/team-finder/project-opportunities";

const stateLabels: Record<ProjectOpportunityState, string> = {
  not_applied: "Not applied",
  pending: "Application pending",
  accepted: "Application accepted",
  rejected: "Rejected · Can reapply",
  withdrawn: "Withdrawn · Can reapply",
  owner: "Project owner",
  member: "Team member",
};

const statusLabels = {
  idea: "Idea",
  building: "Building",
  launched: "Launched",
  completed: "Completed",
} as const;

export function ProjectFinder({
  opportunities,
}: {
  opportunities: ProjectOpportunity[];
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [technology, setTechnology] = useState("All");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const statuses = useMemo(
    () => [...new Set(opportunities.map((item) => item.projectStatus))].sort(),
    [opportunities],
  );
  const technologies = useMemo(
    () => [...new Set(opportunities.flatMap((item) => item.technologies))].sort(),
    [opportunities],
  );
  const filtered = useMemo(
    () => opportunities.filter((item) => {
      const matchesQuery = !deferredQuery || [
        item.projectName,
        item.projectSummary,
        item.projectCategory,
        item.roleTitle,
        item.owner?.fullName ?? "",
        ...item.technologies,
      ].join(" ").toLowerCase().includes(deferredQuery);
      return matchesQuery
        && (status === "All" || item.projectStatus === status)
        && (technology === "All" || item.technologies.includes(technology));
    }),
    [deferredQuery, opportunities, status, technology],
  );
  const hasFilters = Boolean(deferredQuery) || status !== "All" || technology !== "All";

  function clearFilters() {
    setQuery("");
    setStatus("All");
    setTechnology("All");
  }

  return (
    <>
      <div className="mb-7 flex flex-col gap-3 border-y py-4 lg:flex-row lg:items-center">
        <div className="relative max-w-xl flex-1">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="ps-9 shadow-none"
            placeholder="Search projects, roles, technologies, or owners"
            aria-label="Search open project roles"
          />
        </div>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="h-10 rounded-md border bg-background px-3 text-sm"
          aria-label="Filter by project status"
        >
          <option>All</option>
          {statuses.map((item) => (
            <option key={item} value={item}>{statusLabels[item]}</option>
          ))}
        </select>
        <select
          value={technology}
          onChange={(event) => setTechnology(event.target.value)}
          className="h-10 rounded-md border bg-background px-3 text-sm"
          aria-label="Filter by technology"
        >
          <option>All</option>
          {technologies.map((item) => <option key={item}>{item}</option>)}
        </select>
        <span className="text-xs text-muted-foreground lg:ms-auto" aria-live="polite">
          {filtered.length} {filtered.length === 1 ? "open role" : "open roles"}
        </span>
      </div>

      {filtered.length ? (
        <div className="grid gap-5 xl:grid-cols-2">
          {filtered.map((opportunity) => (
            <article key={opportunity.roleId} className="surface flex flex-col rounded-xl p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="capitalize">
                  {opportunity.projectStatus}
                </Badge>
                <span className="text-xs text-muted-foreground">{opportunity.projectCategory}</span>
                <Badge
                  variant={opportunity.state === "accepted" || opportunity.state === "member" ? "default" : "outline"}
                  className="ms-auto"
                >
                  {stateLabels[opportunity.state]}
                </Badge>
              </div>
              <h2 className="mt-5 text-xl font-semibold tracking-[-0.035em]">
                <ClientNavLink href={`/projects/${opportunity.projectSlug}`} className="hover:text-primary">
                  {opportunity.projectName}
                </ClientNavLink>
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {opportunity.projectSummary}
              </p>
              <div className="mt-5 rounded-lg border bg-muted/20 p-4">
                <p className="eyebrow">Open role</p>
                <p className="mt-2 font-semibold">{opportunity.roleTitle}</p>
              </div>
              <div className="mt-5 flex flex-wrap gap-1.5">
                {opportunity.technologies.map((item) => (
                  <Badge key={item} variant="secondary">{item}</Badge>
                ))}
                {!opportunity.technologies.length && (
                  <span className="text-xs text-muted-foreground">No technologies listed.</span>
                )}
              </div>
              <div className="mt-auto flex flex-col gap-4 pt-6 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <BriefcaseBusiness className="size-3.5" />
                    {opportunity.owner ? (
                      <ClientNavLink href={`/u/${opportunity.owner.username}`} className="hover:text-foreground">
                        {opportunity.owner.fullName}
                      </ClientNavLink>
                    ) : "Private project owner"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="size-3.5" />
                    {opportunity.memberCount} {opportunity.memberCount === 1 ? "member" : "members"}
                  </span>
                </div>
                <Button asChild variant={opportunity.canApply ? "default" : "outline"}>
                  <ClientNavLink href={`/projects/${opportunity.projectSlug}`}>
                    {opportunity.canApply ? "View and apply" : "Open project"}
                    <ArrowRight className="size-4" />
                  </ClientNavLink>
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="surface rounded-xl px-6 py-20 text-center">
          <Search className="mx-auto size-5 text-muted-foreground" />
          <h2 className="mt-4 font-semibold">
            {hasFilters ? "No open roles match these filters" : "No open project roles right now"}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {hasFilters
              ? "Try a broader project, role, or technology search."
              : "Open roles will appear here when project owners start recruiting."}
          </p>
          {hasFilters ? (
            <Button className="mt-5" variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          ) : null}
        </div>
      )}
    </>
  );
}
