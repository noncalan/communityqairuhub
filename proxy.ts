import { NextResponse, type NextRequest } from "next/server";
import { isLiveMode } from "@/lib/app-mode";
import { getProfileGate } from "@/lib/data/profiles";
import { updateSession } from "@/lib/supabase/proxy";

const authPages = new Set([
  "/login",
  "/sign-in",
  "/sign-up",
  "/forgot-password",
]);
const publicPages = new Set([
  "/",
  ...authPages,
  "/reset-password",
  "/verify-email",
]);

function redirectWithCookies(
  url: URL,
  source: NextResponse,
  request: NextRequest,
  contentSecurityPolicy: string,
) {
  const target = NextResponse.redirect(url);
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));
  request.cookies.getAll().forEach((cookie) => {
    if (!target.cookies.has(cookie.name)) target.cookies.set(cookie);
  });
  return secureResponse(target, contentSecurityPolicy);
}

function getSupabaseSources() {
  const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!configuredUrl) return [];
  try {
    const origin = new URL(configuredUrl).origin;
    const websocketOrigin = origin.replace(/^http/, "ws");
    return [origin, websocketOrigin];
  } catch {
    return [];
  }
}

function createContentSecurityPolicy(nonce: string) {
  const supabaseSources = getSupabaseSources();
  const developmentSources =
    process.env.NODE_ENV === "development" ? ["ws:", "http:"] : [];
  const scriptSources = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    ...(process.env.NODE_ENV === "development" ? ["'unsafe-eval'"] : []),
  ];

  return [
    "default-src 'self'",
    `script-src ${scriptSources.join(" ")}`,
    `style-src 'self' 'nonce-${nonce}'`,
    "style-src-attr 'unsafe-inline'",
    `img-src 'self' blob: data: ${supabaseSources.join(" ")}`.trim(),
    "font-src 'self' data:",
    `connect-src 'self' ${[...supabaseSources, ...developmentSources].join(" ")}`.trim(),
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    ...(process.env.NODE_ENV === "production"
      ? ["upgrade-insecure-requests"]
      : []),
  ].join("; ");
}

function secureResponse(response: NextResponse, contentSecurityPolicy: string) {
  response.headers.set("Content-Security-Policy", contentSecurityPolicy);
  return response;
}

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const contentSecurityPolicy = createContentSecurityPolicy(nonce);
  const forwardedHeaders = new Headers(request.headers);
  forwardedHeaders.set("Content-Security-Policy", contentSecurityPolicy);
  forwardedHeaders.set("x-nonce", nonce);
  const session = await updateSession(request, forwardedHeaders);
  const response = secureResponse(session.response, contentSecurityPolicy);

  if (!isLiveMode) return response;

  const { supabase, claims } = session;
  if (!supabase) return response;
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith("/auth/")) return response;

  const userId = typeof claims?.sub === "string" ? claims.sub : null;
  if (!userId) {
    if (publicPages.has(pathname)) return response;
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return redirectWithCookies(
      loginUrl,
      response,
      request,
      contentSecurityPolicy,
    );
  }

  const profile = await getProfileGate(supabase, userId);
  if (pathname === "/onboarding") {
    return profile?.onboarding_completed
      ? redirectWithCookies(
          new URL("/home", request.url),
          response,
          request,
          contentSecurityPolicy,
        )
      : response;
  }
  if (!profile?.onboarding_completed && pathname !== "/reset-password") {
    return redirectWithCookies(
      new URL("/onboarding", request.url),
      response,
      request,
      contentSecurityPolicy,
    );
  }
  if (authPages.has(pathname)) {
    return redirectWithCookies(
      new URL("/home", request.url),
      response,
      request,
      contentSecurityPolicy,
    );
  }
  return response;
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"] };
