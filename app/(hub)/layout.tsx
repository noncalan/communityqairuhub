import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { CurrentUserProvider } from "@/lib/auth/current-user-provider";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isLiveMode } from "@/lib/app-mode";

export default async function HubLayout({ children }: { children: React.ReactNode }) {
  if (!isLiveMode) return <AppShell>{children}</AppShell>;
  const { userId, profile } = await getCurrentUser();
  if (!userId) redirect("/login");
  if (!profile?.onboardingCompleted) redirect("/onboarding");
  return (
    <CurrentUserProvider initialProfile={profile}>
      <AppShell>{children}</AppShell>
    </CurrentUserProvider>
  );
}
