export const RECOVERY_COOKIE_NAME = "qairu-recovery";

export const RECOVERY_COOKIE_MAX_AGE_SECONDS = 15 * 60;

export const recoveryCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: RECOVERY_COOKIE_MAX_AGE_SECONDS,
};
