import type { ProfileMutationInput } from "@/lib/data/profiles";

const usernamePattern = /^[a-z0-9_]{3,30}$/;
const reservedUsernames = new Set([
  "admin",
  "api",
  "auth",
  "login",
  "onboarding",
  "qairu",
  "root",
  "settings",
  "signup",
  "support",
  "system",
  "www",
]);

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
}

export function validateProfileInput(input: ProfileMutationInput) {
  if (!usernamePattern.test(input.username)) {
    return "Username must be 3–30 lowercase letters, numbers, or underscores.";
  }
  if (reservedUsernames.has(input.username)) {
    return "That username is reserved. Please choose another.";
  }
  if (input.fullName.trim().length < 2 || input.fullName.trim().length > 80) {
    return "Full name must be between 2 and 80 characters.";
  }
  if (input.bio.length > 500) return "Bio must be 500 characters or less.";
  if (!input.programId) return "Choose your program.";
  if (input.academicYear < 1 || input.academicYear > 8) {
    return "Choose a valid academic year.";
  }
  if (!input.interestIds.length) return "Choose at least one interest.";
  if (!input.skillIds.length) return "Choose at least one skill.";
  return null;
}
