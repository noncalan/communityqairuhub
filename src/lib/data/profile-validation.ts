import {
  academicDirections,
  contributionOptions,
  rolesForDirection,
} from "./onboarding-options.ts";
import type {
  OnboardingProfileInput,
  ProfileMutationInput,
} from "@/lib/data/profiles";

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
  const basicError = validateBasicProfile(input);
  if (basicError) return basicError;
  if (!input.programId) return "Choose your program.";
  if (input.academicYear < 1 || input.academicYear > 8) {
    return "Choose a valid academic year.";
  }
  if (!input.interestIds.length) return "Choose at least one interest.";
  if (!input.skillIds.length) return "Choose at least one skill.";
  return null;
}

export function validateOnboardingProfileInput(input: OnboardingProfileInput) {
  const basicError = validateBasicProfile(input);
  if (basicError) return basicError;

  if (!academicDirections.some((direction) => direction.id === input.academicDirection)) {
    return "Choose an academic direction.";
  }
  if (!rolesForDirection(input.academicDirection).some((role) => role.id === input.desiredRole)) {
    return "Choose a role that matches your academic direction.";
  }
  if (input.interestIds.length < 1 || input.interestIds.length > 5) {
    return "Choose between 1 and 5 project interests.";
  }
  if (new Set(input.interestIds).size !== input.interestIds.length) {
    return "Choose unique project interests.";
  }
  if (input.contributionPreferences.length < 1 || input.contributionPreferences.length > 5) {
    return "Choose between 1 and 5 contribution preferences.";
  }
  if (new Set(input.contributionPreferences).size !== input.contributionPreferences.length) {
    return "Choose unique contribution preferences.";
  }
  if (
    input.contributionPreferences.some(
      (value) => !contributionOptions.some((option) => option.id === value),
    )
  ) {
    return "Choose valid contribution preferences.";
  }
  return null;
}

function validateBasicProfile(input: Pick<ProfileMutationInput, "username" | "fullName" | "bio">) {
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
  return null;
}
