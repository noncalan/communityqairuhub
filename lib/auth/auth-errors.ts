import { PASSWORD_REQUIREMENT_SUMMARY } from "./password-policy.ts";

type AuthContext = "sign-in" | "sign-up" | "forgot" | "reset";

type AuthErrorLike = {
  code?: unknown;
  message?: unknown;
  name?: unknown;
};

function errorDetails(error: unknown) {
  if (!error || typeof error !== "object") {
    return { code: "", message: "", name: "" };
  }

  const candidate = error as AuthErrorLike;
  return {
    code: typeof candidate.code === "string" ? candidate.code : "",
    message: typeof candidate.message === "string" ? candidate.message : "",
    name: typeof candidate.name === "string" ? candidate.name : "",
  };
}

export function authErrorMessage(error: unknown, context: AuthContext) {
  const { code, message, name } = errorDetails(error);

  if (code === "invalid_credentials" || /invalid login credentials/i.test(message)) {
    return "Email or password is incorrect.";
  }
  if (code === "email_not_confirmed" || /email not confirmed/i.test(message)) {
    return "Confirm your email before signing in.";
  }
  if (code === "weak_password" || name === "AuthWeakPasswordError") {
    return `Choose a stronger password. ${PASSWORD_REQUIREMENT_SUMMARY}`;
  }
  if (code === "same_password") {
    return "Choose a password different from your current password.";
  }
  if (
    code === "session_not_found" ||
    code === "session_expired" ||
    code === "refresh_token_not_found" ||
    code === "invalid_recovery_session"
  ) {
    return "This password reset session has expired. Request a new reset link.";
  }
  if (code === "user_already_exists" || /user already registered/i.test(message)) {
    return "Authentication could not be completed. Try signing in or resetting your password.";
  }
  if (code === "email_address_not_authorized") {
    return "Sign-up email delivery is currently unavailable for this address. Please contact the QAIRU Hub team.";
  }
  if (
    code === "over_request_rate_limit" ||
    code === "over_email_send_rate_limit" ||
    /rate limit/i.test(message)
  ) {
    return "Too many attempts. Please wait and try again.";
  }
  if (
    name === "AuthRetryableFetchError" ||
    /failed to fetch|network|load failed/i.test(message)
  ) {
    return "We could not reach the authentication service. Check your connection and try again.";
  }

  if (context === "sign-in") {
    return "Sign in could not be completed. Please try again.";
  }
  if (context === "reset") {
    return "Password could not be updated. Please try again or request a new reset link.";
  }
  return "Authentication could not be completed. Please try again.";
}
