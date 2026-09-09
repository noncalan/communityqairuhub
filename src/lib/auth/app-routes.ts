const protectedRouteRoots = [
  "/admin",
  "/api",
  "/communities",
  "/events",
  "/find",
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

export function isCoreApiPath(pathname: string) {
  return pathname === "/api/core" || pathname.startsWith("/api/core/");
}

export function isPublicClubBrowsePath(pathname: string) {
  if (pathname === "/clubs") return true;
  const segments = pathname.split("/").filter(Boolean);
  return segments.length === 2 && segments[0] === "clubs" && segments[1] !== "new";
}

export function isProtectedClubManagementPath(pathname: string) {
  return pathname === "/clubs/new" || /^\/clubs\/[^/]+\/edit$/.test(pathname);
}
