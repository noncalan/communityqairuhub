"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  saveProfile,
  type ProfileMutationInput,
} from "@/lib/data/profiles";
import {
  normalizeUsername,
  validateProfileInput,
} from "@/lib/data/profile-validation";

type ActionResult =
  | { ok: true; profile: NonNullable<Awaited<ReturnType<typeof saveProfile>>> }
  | { ok: false; error: string };

function messageForDatabaseError(error: unknown) {
  if (
    typeof error === "object" &&
    error &&
    "code" in error &&
    error.code === "23505"
  ) {
    return "That username is already taken.";
  }
  return "We could not save your profile. Please try again.";
}

async function mutateProfile(
  rawInput: ProfileMutationInput,
  completeOnboarding: boolean,
): Promise<ActionResult> {
  const input = {
    ...rawInput,
    username: normalizeUsername(rawInput.username),
    fullName: rawInput.fullName.trim(),
    bio: rawInput.bio.trim(),
    interestIds: [...new Set(rawInput.interestIds)],
    skillIds: [...new Set(rawInput.skillIds)],
  };
  const validationError = validateProfileInput(input);
  if (validationError) return { ok: false, error: validationError };

  const { supabase, userId } = await getCurrentUser();
  if (!userId) return { ok: false, error: "Your session expired. Sign in again." };

  try {
    const profile = await saveProfile(
      supabase,
      userId,
      input,
      completeOnboarding,
    );
    if (!profile) return { ok: false, error: "Profile could not be loaded." };
    revalidatePath("/home");
    revalidatePath("/people");
    revalidatePath("/settings");
    revalidatePath(`/u/${profile.username}`);
    return { ok: true, profile };
  } catch (error) {
    return { ok: false, error: messageForDatabaseError(error) };
  }
}

export async function completeOnboardingAction(input: ProfileMutationInput) {
  return mutateProfile(input, true);
}

export async function updateProfileAction(input: ProfileMutationInput) {
  return mutateProfile(input, true);
}
