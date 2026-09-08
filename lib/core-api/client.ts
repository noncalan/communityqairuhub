import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getCoreApiConfig } from "./config";

export function createCoreSupabaseClient() {
  const { supabaseUrl, supabaseSecretKey } = getCoreApiConfig();
  return createClient<Database>(supabaseUrl, supabaseSecretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
