import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  getCurrentUserSummary as getCurrentUserSummaryById,
  getProfileById,
  getProfileGate,
} from "@/lib/data/profiles";
import { withServerTiming } from "@/lib/observability/server-timing";
import {
  VERIFIED_USER_EMAIL_HEADER,
  VERIFIED_USER_ID_HEADER,
} from "@/lib/auth/verified-request";

export const getCurrentAuth = cache(async function getCurrentAuth() {
  return withServerTiming(
    "current-user-auth",
    async () => {
      const supabase = await createClient();
      const requestHeaders = await headers();
      const verifiedUserId = requestHeaders.get(VERIFIED_USER_ID_HEADER);
      if (verifiedUserId) {
        return {
          supabase,
          userId: verifiedUserId,
          email: requestHeaders.get(VERIFIED_USER_EMAIL_HEADER),
          claims: null,
        };
      }

      const { data, error } = await withServerTiming(
        "current-user-claims-fallback",
        () => supabase.auth.getClaims(),
        { loader: "getCurrentAuth" },
      );
      if (error || !data?.claims?.sub) {
        return { supabase, userId: null, email: null, claims: null };
      }
      return {
        supabase,
        userId: data.claims.sub,
        email:
          typeof data.claims.email === "string" ? data.claims.email : null,
        claims: data.claims,
      };
    },
    { loader: "getCurrentAuth" },
  );
});

export const getCurrentProfileGate = cache(async function getCurrentProfileGate() {
  const current = await getCurrentAuth();
  if (!current.userId) {
    return { ...current, profileGate: null, onboardingCompleted: false };
  }
  const profileGate = await withServerTiming(
    "current-user-profile-gate",
    () => getProfileGate(current.supabase, current.userId!),
    { loader: "getCurrentProfileGate" },
  );
  return {
    ...current,
    profileGate,
    onboardingCompleted: profileGate?.onboarding_completed === true,
  };
});

export const getCurrentUserSummary = cache(async function getCurrentUserSummary() {
  return withServerTiming(
    "current-user-summary",
    async () => {
      const current = await getCurrentAuth();
      if (!current.userId) return { ...current, profile: null };
      const profile = await withServerTiming(
        "current-user-summary-profile",
        () => getCurrentUserSummaryById(current.supabase, current.userId!),
        { loader: "getCurrentUserSummary" },
      );
      return { ...current, profile };
    },
    { loader: "getCurrentUserSummary" },
  );
});

export const getCurrentUser = cache(async function getCurrentUser() {
  return withServerTiming(
    "current-user-full",
    async () => {
      const current = await getCurrentAuth();
      if (!current.userId) return { ...current, profile: null };
      const profile = await withServerTiming(
        "current-user-profile",
        () => getProfileById(current.supabase, current.userId!),
        { loader: "getCurrentUser" },
      );
      return { ...current, profile };
    },
    { loader: "getCurrentUser" },
  );
});
