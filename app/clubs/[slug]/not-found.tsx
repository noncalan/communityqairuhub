import { ClientNavLink } from "@/components/shared/client-nav-link";
import { Button } from "@/components/ui/button";

export default function ClubNotFound() {
  return (
    <div className="page-container py-24 text-center">
      <p className="eyebrow">Club unavailable</p>
      <h1 className="mt-3 text-3xl font-semibold">This club is missing or inactive</h1>
      <p className="mt-2 text-sm text-muted-foreground">Only active clubs appear in the public directory and Telegram bot.</p>
      <Button className="mt-6" asChild><ClientNavLink href="/clubs">Browse active clubs</ClientNavLink></Button>
    </div>
  );
}
