import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="page-container text-center">
      <h1 className="text-2xl font-semibold">Student not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">This profile does not exist or is not visible to the campus.</p>
      <Button asChild className="mt-5"><Link href="/people">Back to people</Link></Button>
    </div>
  );
}
