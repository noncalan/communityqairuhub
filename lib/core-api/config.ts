import "server-only";

export type CoreApiConfig = {
  coreApiKey: string;
  supabaseUrl: string;
  supabaseSecretKey: string;
};

export function getCoreApiConfig(): CoreApiConfig {
  const coreApiKey = process.env.CORE_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseSecretKey =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!coreApiKey || coreApiKey.length < 32) {
    throw new Error("CORE_API_KEY must contain at least 32 characters.");
  }
  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error("Core API Supabase server credentials are not configured.");
  }

  return { coreApiKey, supabaseUrl, supabaseSecretKey };
}
