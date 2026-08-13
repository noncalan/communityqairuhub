const localDevelopmentOrigin = "http://localhost:3010";

const localHostnames = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function normalizeSiteOrigin(value: string) {
  const url = new URL(value);
  const hasUnexpectedParts =
    Boolean(url.username) ||
    Boolean(url.password) ||
    Boolean(url.search) ||
    Boolean(url.hash) ||
    (url.pathname !== "/" && url.pathname !== "");

  if (hasUnexpectedParts) {
    throw new Error("NEXT_PUBLIC_SITE_URL must contain only an origin");
  }

  const isHttps = url.protocol === "https:";
  const isLocalHttp =
    url.protocol === "http:" && localHostnames.has(url.hostname);
  if (!isHttps && !isLocalHttp) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL must use HTTPS except for local development",
    );
  }

  return url.origin;
}

export function getTrustedSiteOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return normalizeSiteOrigin(configured);

  if (
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_APP_MODE !== "live"
  ) {
    return localDevelopmentOrigin;
  }

  throw new Error("NEXT_PUBLIC_SITE_URL is required outside local demo mode");
}
