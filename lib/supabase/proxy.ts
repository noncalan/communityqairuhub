import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";
import {
  measureServerTiming,
  type ServerTimingMetric,
} from "@/lib/observability/server-timing";
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
  if (!url || !key) {
    return { response, supabase: null, claims: null, authMetrics: [] };
  }
  clearVerifiedRequestHeaders(forwardedHeaders);
  const authMetrics: ServerTimingMetric[] = [];
  const nativeFetch = globalThis.fetch;
  const timedAuthFetch: typeof fetch = async (input, init) => {
    const requestUrl =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    const pathname = new URL(requestUrl).pathname;
    const metricName = pathname.endsWith("/.well-known/jwks.json")
      ? "proxy-auth-jwks"
      : pathname.endsWith("/token")
        ? "proxy-auth-refresh"
        : pathname.endsWith("/user")
          ? "proxy-auth-user"
          : "proxy-auth-network";
    const { value, metric } = await measureServerTiming(
      metricName,
      () => nativeFetch(input, init),
      { pathname: request.nextUrl.pathname, authEndpoint: pathname },
      `Supabase Auth ${pathname}`,
    );
    authMetrics.push(metric);
    return value;
  };
  const supabase = createServerClient<Database>(url, key, {
    global: { fetch: timedAuthFetch },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items) => {
        items.forEach(({ name, value }) => request.cookies.set(name, value));
        response = nextResponse();
        items.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });
  const { value: claimsResult, metric: claimsMetric } = await measureServerTiming(
    "proxy-claims",
    () => supabase.auth.getClaims(),
    { pathname: request.nextUrl.pathname },
    "Supabase claims validation",
  );
  authMetrics.unshift(claimsMetric);
  const { data } = claimsResult;
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

  return { response, supabase, claims, authMetrics };
}
