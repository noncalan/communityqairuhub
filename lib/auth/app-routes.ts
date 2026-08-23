const protectedRouteRoots = [
  "/admin",
  "/api",
  "/communities",
  "/events",
  "/home",
  "/messages",
  "/notifications",
  "/onboarding",
  "/opportunities",
  "/people",
  "/projects",
  "/resources",
  "/settings",
  "/u",
] as const;

export function isProtectedAppPath(pathname: string) {
  return protectedRouteRoots.some(
    (root) => pathname === root || pathname.startsWith(`${root}/`),
  );
}
