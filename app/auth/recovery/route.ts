import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { RECOVERY_COOKIE_NAME } from "@/lib/auth/recovery";
import { validatePassword } from "@/lib/auth/password-policy";
import { createClient } from "@/lib/supabase/server";

const safeRecoveryErrorCodes = new Set([
  "weak_password",
  "same_password",
  "session_not_found",
  "session_expired",
  "refresh_token_not_found",
  "reauthentication_needed",
]);

function recoveryError(code: string, status: number) {
  return NextResponse.json({ error: { code } }, { status });
}

export async function PUT(request: Request) {
  const cookieStore = await cookies();
  if (cookieStore.get(RECOVERY_COOKIE_NAME)?.value !== "active") {
    return recoveryError("invalid_recovery_session", 403);
  }

  let password = "";
  try {
    const body = (await request.json()) as { password?: unknown };
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    return recoveryError("invalid_request", 400);
  }

  if (validatePassword(password).length > 0) {
    return recoveryError("weak_password", 400);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    const code = safeRecoveryErrorCodes.has(error.code ?? "")
      ? error.code!
      : "unexpected_failure";
    return recoveryError(code, error.status ?? 400);
  }

  return NextResponse.json({ ok: true });
}

export async function POST() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut({ scope: "local" });
  const cookieStore = await cookies();
  cookieStore.delete(RECOVERY_COOKIE_NAME);

  if (error && error.code !== "session_not_found") {
    return NextResponse.json(
      { error: "recovery_session_cleanup_failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
