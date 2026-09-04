import "server-only";

import { getTrustedSiteOrigin } from "@/lib/security/site-origin";

export function getAllowedClubLogoOrigins() {
  const candidates = [
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    getTrustedSiteOrigin(),
  ];
  return [...new Set(candidates.flatMap((value) => {
    if (!value) return [];
    try {
      const origin = new URL(value).origin;
      return origin.startsWith("https://") ? [origin] : [];
    } catch {
      return [];
    }
  }))];
}
