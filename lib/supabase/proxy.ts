import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";
import {
  clearVerifiedRequestHeaders,
  VERIFIED_USER_EMAIL_HEADER,
  VERIFIED_USER_ID_HEADER,
} from "@/lib/auth/verified-request";

export async function updateSession(
  request: NextRequest,
  forwardedHeaders = request.headers,
) {
  const nextResponse = () =>
    NextResponse.next({ request: { headers: forwardedHeaders } });
  let response = nextResponse();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return { response, supabase: null, claims: null };
  clearVerifiedRequestHeaders(forwardedHeaders);
  const supabase = createServerClient<Database>(url, key, { cookies: { getAll: () => request.cookies.getAll(), setAll: (items) => { items.forEach(({ name, value }) => request.cookies.set(name, value)); response = nextResponse(); items.forEach(({ name, value, options }) => response.cookies.set(name, value, options)); } } });
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims ?? null;
  const userId = typeof claims?.sub === "string" ? claims.sub : null;
  const email = typeof claims?.email === "string" ? claims.email : null;
  if (userId) forwardedHeaders.set(VERIFIED_USER_ID_HEADER, userId);
  if (email) forwardedHeaders.set(VERIFIED_USER_EMAIL_HEADER, email);

  const responseCookies = response.cookies.getAll();
  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) forwardedHeaders.set("cookie", cookieHeader);
  else forwardedHeaders.delete("cookie");
  response = nextResponse();
  responseCookies.forEach((cookie) => response.cookies.set(cookie));

  return { response, supabase, claims };
}
