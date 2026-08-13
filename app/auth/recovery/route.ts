import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { RECOVERY_COOKIE_NAME } from "@/lib/auth/recovery";
import { createClient } from "@/lib/supabase/server";

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
