import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getProfileById } from "@/lib/data/profiles";

export const getCurrentUser = cache(async function getCurrentUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) {
    return { supabase, userId: null, email: null, profile: null };
  }
  const userId = data.claims.sub;
  const profile = await getProfileById(supabase, userId);
  return {
    supabase,
    userId,
    email: typeof data.claims.email === "string" ? data.claims.email : null,
    profile,
  };
});
