import { createClient } from "@/lib/supabase/client";

const siteUrl = () =>
  process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;

export const authService = {
  async signUp(email: string, password: string) {
    return createClient().auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${siteUrl()}/auth/callback` },
    });
  },

  async signIn(email: string, password: string) {
    return createClient().auth.signInWithPassword({ email, password });
  },

  async requestPasswordReset(email: string) {
    return createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl()}/auth/callback?next=/reset-password`,
    });
  },

  async updatePassword(password: string) {
    return createClient().auth.updateUser({ password });
  },

  async signOut() {
    const supabase = createClient();
    await supabase.removeAllChannels();
    return supabase.auth.signOut();
  },
};
