import { cn } from "@/lib/utils";

export function ClubLogo({
  name,
  logoUrl,
  className,
}: {
  name: string;
  logoUrl: string | null;
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  if (logoUrl) {
    return (
      <span
        role="img"
        aria-label={`${name} logo`}
        className={cn("block bg-muted bg-cover bg-center", className)}
        style={{ backgroundImage: `url(${JSON.stringify(logoUrl)})` }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid place-items-center bg-primary/10 font-semibold tracking-[-0.04em] text-primary",
        className,
      )}
    >
      {initials || "Q"}
    </span>
  );
}
