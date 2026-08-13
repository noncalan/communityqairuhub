import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfileById } from "@/lib/data/profiles";
import { safeInternalPath } from "@/lib/security/redirects";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeInternalPath(url.searchParams.get("next"), url.origin);

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=missing_confirmation_code", url.origin),
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return NextResponse.redirect(
      new URL("/login?error=confirmation_failed", url.origin),
    );
  }

  if (next) return NextResponse.redirect(new URL(next, url.origin));
  const profile = await getProfileById(supabase, data.user.id);
  return NextResponse.redirect(
    new URL(profile?.onboardingCompleted ? "/home" : "/onboarding", url.origin),
  );
}
