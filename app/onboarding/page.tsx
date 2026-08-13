import { redirect } from "next/navigation";
import { Brand } from "@/components/shared/brand";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { OnboardingFlow } from "@/components/auth/onboarding-flow";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isLiveMode } from "@/lib/app-mode";
import { getProfileReferences, type ReferenceItem } from "@/lib/data/profiles";

const namesToReferences = (names: string[]): ReferenceItem[] =>
  names.map((name) => ({ id: name, name }));

export default async function Page() {
  let references;
  if (isLiveMode) {
    const { supabase, userId, profile } = await getCurrentUser();
    if (!userId) redirect("/login");
    if (profile?.onboardingCompleted) redirect("/home");
    references = await getProfileReferences(supabase);
  } else {
    references = {
      programs: namesToReferences([
        "Artificial Intelligence",
        "Business",
        "Computer Science",
        "Data Science",
        "Product Management",
      ]),
      interests: namesToReferences([
        "Artificial Intelligence",
        "Startups",
        "Design",
        "Robotics",
        "Film",
        "Football",
        "Data",
        "Open source",
        "Debate",
        "Climate",
      ]),
      skills: namesToReferences([
        "Python",
        "JavaScript",
        "Machine Learning",
        "UI/UX",
        "Marketing",
        "Finance",
        "Video",
        "Robotics",
        "Research",
        "Writing",
      ]),
    };
  }

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex h-16 max-w-5xl items-center px-5">
        <Brand />
        <div className="ms-auto"><ThemeToggle /></div>
      </header>
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center px-5 py-12">
        <OnboardingFlow references={references} />
      </main>
    </div>
  );
}
