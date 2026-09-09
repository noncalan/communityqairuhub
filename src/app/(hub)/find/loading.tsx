import { RouteDataSkeleton } from "@/components/shared/route-data-skeleton";

export default function FindLoading() {
  return (
    <div className="page-container" aria-label="Loading Team Finder">
      <div className="h-3 w-28 animate-pulse rounded bg-muted" />
      <div className="mt-4 h-10 w-64 animate-pulse rounded bg-muted" />
      <RouteDataSkeleton label="Loading Team Finder" />
    </div>
  );
}
