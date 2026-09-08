import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function RouteDataSkeleton({
  count = 6,
  className,
  itemClassName,
  label = "Loading content",
}: {
  count?: number;
  className?: string;
  itemClassName?: string;
  label?: string;
}) {
  return (
    <div
      className={cn("mt-7 grid gap-4 sm:grid-cols-2", className)}
      aria-label={label}
      aria-live="polite"
    >
      {Array.from({ length: count }, (_, index) => (
        <Skeleton
          key={index}
          className={cn("h-40 rounded-lg", itemClassName)}
        />
      ))}
    </div>
  );
}
