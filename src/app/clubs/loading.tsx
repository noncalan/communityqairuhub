import { RouteDataSkeleton } from "@/components/shared/route-data-skeleton";

export default function ClubsLoading() {
  return (
    <div className="page-container">
      <div className="h-3 w-32 animate-pulse rounded bg-muted" />
      <div className="mt-4 h-10 w-64 animate-pulse rounded bg-muted" />
      <div className="mt-3 h-4 w-full max-w-lg animate-pulse rounded bg-muted" />
      <RouteDataSkeleton label="Loading clubs" />
    </div>
  );
}
