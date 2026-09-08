import { redirect } from "next/navigation";
import { Brand } from "@/components/shared/brand";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { OnboardingFlow } from "@/components/auth/onboarding-flow";
import { getCurrentProfileGate } from "@/lib/auth/current-user";
import { isLiveMode } from "@/lib/app-mode";
import { projectInterestNames } from "@/lib/data/onboarding-options";
import { getOnboardingInterests, type ReferenceItem } from "@/lib/data/profiles";

const namesToReferences = (names: string[]): ReferenceItem[] =>
  names.map((name) => ({ id: name, name }));

export default async function Page() {
  let interests;
  if (isLiveMode) {
    const { supabase, userId, onboardingCompleted } = await getCurrentProfileGate();
    if (!userId) redirect("/login");
    if (onboardingCompleted) redirect("/home");
    interests = await getOnboardingInterests(supabase);
  } else {
    interests = namesToReferences([...projectInterestNames]);
  }

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex h-16 max-w-5xl items-center px-5">
        <Brand />
        <div className="ms-auto"><ThemeToggle /></div>
      </header>
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center px-5 py-12">
        <OnboardingFlow interests={interests} />
      </main>
    </div>
  );
}
