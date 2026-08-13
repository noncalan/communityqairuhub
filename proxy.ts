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
) {
  const target = NextResponse.redirect(url);
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));
  request.cookies.getAll().forEach((cookie) => {
    if (!target.cookies.has(cookie.name)) target.cookies.set(cookie);
  });
  return target;
}

export async function proxy(request: NextRequest) {
  if (!isLiveMode) return (await updateSession(request)).response;

  const { response, supabase, claims } = await updateSession(request);
  if (!supabase) return response;
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith("/auth/")) return response;

  const userId = typeof claims?.sub === "string" ? claims.sub : null;
  if (!userId) {
    if (publicPages.has(pathname)) return response;
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return redirectWithCookies(loginUrl, response, request);
  }

  const profile = await getProfileGate(supabase, userId);
  if (pathname === "/onboarding") {
    return profile?.onboarding_completed
      ? redirectWithCookies(new URL("/home", request.url), response, request)
      : response;
  }
  if (!profile?.onboarding_completed && pathname !== "/reset-password") {
    return redirectWithCookies(
      new URL("/onboarding", request.url),
      response,
      request,
    );
  }
  if (authPages.has(pathname)) {
    return redirectWithCookies(
      new URL("/home", request.url),
      response,
      request,
    );
  }
  return response;
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"] };
