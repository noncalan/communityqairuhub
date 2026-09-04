import { NextResponse, type NextRequest } from "next/server";
import { isLiveMode } from "@/lib/app-mode";
import { getProfileGate } from "@/lib/data/profiles";
import { getTrustedSiteOrigin } from "@/lib/security/site-origin";
import { updateSession } from "@/lib/supabase/proxy";
import { RECOVERY_COOKIE_NAME } from "@/lib/auth/recovery";
import {
  isProtectedAppPath,
  isProtectedClubManagementPath,
  isPublicClubBrowsePath,
} from "@/lib/auth/app-routes";

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

function clearRecoveryCookie(response: NextResponse) {
  response.cookies.set(RECOVERY_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}

export async function proxy(request: NextRequest) {
  const siteOrigin = getTrustedSiteOrigin();
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const contentSecurityPolicy = createContentSecurityPolicy(nonce);
  const forwardedHeaders = new Headers(request.headers);
  forwardedHeaders.set("Content-Security-Policy", contentSecurityPolicy);
  forwardedHeaders.set("x-nonce", nonce);
  const pathname = request.nextUrl.pathname;
  if (pathname === "/api/telegram/webhook") {
    return secureResponse(
      NextResponse.next({ request: { headers: forwardedHeaders } }),
      contentSecurityPolicy,
    );
  }
  const session = await updateSession(request, forwardedHeaders);
  const response = secureResponse(session.response, contentSecurityPolicy);

  if (!isLiveMode) return response;

  const { supabase, claims } = session;
  if (!supabase) return response;
  if (pathname.startsWith("/auth/")) return response;

  const userId = typeof claims?.sub === "string" ? claims.sub : null;
  const recoveryFlow =
    request.cookies.get(RECOVERY_COOKIE_NAME)?.value === "active";

  if (recoveryFlow) {
    if (!userId) {
      if (pathname === "/reset-password") {
        const forgotUrl = new URL("/forgot-password", siteOrigin);
        forgotUrl.searchParams.set("error", "recovery_session_expired");
        return clearRecoveryCookie(
          redirectWithCookies(
            forgotUrl,
            response,
            request,
            contentSecurityPolicy,
          ),
        );
      }
      return clearRecoveryCookie(response);
    }

    if (pathname !== "/reset-password") {
      return redirectWithCookies(
        new URL("/reset-password", siteOrigin),
        response,
        request,
        contentSecurityPolicy,
      );
    }
    return response;
  }

  if (pathname === "/reset-password") {
    const destination = new URL(userId ? "/home" : "/forgot-password", siteOrigin);
    if (!userId) destination.searchParams.set("error", "invalid_recovery_session");
    return redirectWithCookies(
      destination,
      response,
      request,
      contentSecurityPolicy,
    );
  }

  if (!userId) {
    if (publicPages.has(pathname) || isPublicClubBrowsePath(pathname)) return response;
    if (!isProtectedAppPath(pathname) && !isProtectedClubManagementPath(pathname)) return response;
    const loginUrl = new URL("/login", siteOrigin);
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
          new URL("/home", siteOrigin),
          response,
          request,
          contentSecurityPolicy,
        )
      : response;
  }
  if (!profile?.onboarding_completed && pathname !== "/reset-password") {
    return redirectWithCookies(
      new URL("/onboarding", siteOrigin),
      response,
      request,
      contentSecurityPolicy,
    );
  }
  if (authPages.has(pathname)) {
    return redirectWithCookies(
      new URL("/home", siteOrigin),
      response,
      request,
      contentSecurityPolicy,
    );
  }
  return response;
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"] };
