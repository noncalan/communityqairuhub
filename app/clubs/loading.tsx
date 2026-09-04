import { Skeleton } from "@/components/ui/skeleton";

export default function ClubsLoading() {
  return (
    <div className="page-container" aria-label="Loading clubs">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-4 h-10 w-64" />
      <Skeleton className="mt-3 h-5 max-w-2xl" />
      <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((item) => <Skeleton key={item} className="h-72 rounded-xl" />)}
      </div>
    </div>
  );
}
