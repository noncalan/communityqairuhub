import { Compass } from "lucide-react";
import { OpportunitiesPage } from "@/components/demo/opportunities-page";
import { isLiveMode } from "@/lib/app-mode";

export default function Page() {
  if (!isLiveMode) return <OpportunitiesPage />;

  return (
    <div className="page-container">
      <div className="surface mx-auto max-w-2xl rounded-xl p-8 text-center sm:p-12">
        <span className="mx-auto grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
          <Compass className="size-5" />
        </span>
        <p className="eyebrow mt-6">Intentional Preview placeholder</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em]">
          Opportunities are not live yet
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-muted-foreground">
          Verified internships, grants, programs and competitions will appear
          here after a trusted publishing workflow is ready. QAIRU Hub does not
          show illustrative listings as live opportunities.
        </p>
      </div>
    </div>
  );
}
