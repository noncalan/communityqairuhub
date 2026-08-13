import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  return (
    <div className="w-full max-w-sm text-center">
      <MailCheck className="mx-auto size-10 text-primary" />
      <p className="eyebrow mt-6">One more step</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em]">
        Verify your email
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        We sent a confirmation link{email ? <> to <strong>{email}</strong></> : null}.
        Open it to activate your account and continue onboarding.
      </p>
      <Button asChild className="mt-7 w-full" variant="outline">
        <Link href="/login">Back to sign in</Link>
      </Button>
    </div>
  );
}
