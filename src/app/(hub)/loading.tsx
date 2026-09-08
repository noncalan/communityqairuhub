import { Skeleton } from "@/components/ui/skeleton";

export default function HubLoading() {
  return (
    <div className="page-container" aria-label="Loading page">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="mt-4 h-10 w-72" />
      <Skeleton className="mt-3 h-4 w-full max-w-lg" />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-48 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
