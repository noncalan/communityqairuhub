import { createClient } from "@/lib/supabase/client";
import { getTrustedSiteOrigin } from "@/lib/security/site-origin";

export const authService = {
  async signUp(email: string, password: string) {
    return createClient().auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${getTrustedSiteOrigin()}/auth/callback`,
      },
    });
  },

  async signIn(email: string, password: string) {
    return createClient().auth.signInWithPassword({ email, password });
  },

  async requestPasswordReset(email: string) {
    return createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${getTrustedSiteOrigin()}/auth/callback?next=/reset-password`,
    });
  },

  async updatePassword(password: string) {
    try {
      const response = await fetch("/auth/recovery", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const body = (await response.json()) as {
        error?: { code?: string };
      };
      return {
        error: response.ok
          ? null
          : { code: body.error?.code ?? "unexpected_failure" },
      };
    } catch {
      return {
        error: {
          code: "network_error",
          name: "AuthRetryableFetchError",
        },
      };
    }
  },

  async endRecoverySession() {
    try {
      const response = await fetch("/auth/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
        await createClient().auth.signOut({ scope: "local" });
        return { error: null };
      }
    } catch {
      // Fall through to a browser-local sign-out if the route is unreachable.
    }

    const { error } = await createClient().auth.signOut({ scope: "local" });
    return { error };
  },

  async signOut() {
    const supabase = createClient();
    await supabase.removeAllChannels();
    return supabase.auth.signOut();
  },
};
