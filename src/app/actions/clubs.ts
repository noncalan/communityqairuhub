"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfileGate } from "@/lib/auth/current-user";
import { createClub, updateClub } from "@/lib/clubs/data";
import { getAllowedClubLogoOrigins } from "@/lib/clubs/logo-origins";
import {
  type ClubInput,
  validateClubInput,
} from "@/lib/clubs/validation";

export type ClubActionResult =
  | { ok: true; slug: string }
  | {
      ok: false;
      message: string;
      fieldErrors?: Partial<Record<keyof ClubInput, string>>;
    };

function databaseMessage(error: unknown) {
  if (typeof error !== "object" || !error) {
    return "The club could not be saved. Please try again.";
  }
  const code = "code" in error ? String(error.code) : "";
  const message = "message" in error ? String(error.message) : "";
  if (code === "23505" && message.includes("slug")) {
    return "That club slug is already in use. Choose another one.";
  }
  if (code === "42501" || code === "PGRST116") {
    return "You do not have permission to edit this club.";
  }
  if (message.includes("Rate limit exceeded")) {
    return "Too many club changes. Please wait and try again.";
  }
  if (code === "23514" || code === "22001") {
    return "Some club details are outside the allowed range.";
  }
  return "The club could not be saved. Please try again.";
}

function validate(input: ClubInput) {
  return validateClubInput(input, {
    allowedLogoOrigins: getAllowedClubLogoOrigins(),
  });
}

export async function createClubAction(input: ClubInput): Promise<ClubActionResult> {
  const current = await getCurrentProfileGate();
  if (!current.userId) return { ok: false, message: "Sign in to create a club." };
  if (!current.onboardingCompleted) return { ok: false, message: "Complete onboarding before creating a club." };
  const validation = validate(input);
  if (!validation.ok) return validation;

  try {
    const club = await createClub(current.supabase, validation.data);
    revalidatePath("/clubs");
    revalidatePath(`/clubs/${club.slug}`);
    revalidatePath("/communities");
    return { ok: true, slug: club.slug };
  } catch (error) {
    return { ok: false, message: databaseMessage(error) };
  }
}

export async function updateClubAction(
  clubId: string,
  input: ClubInput,
): Promise<ClubActionResult> {
  const current = await getCurrentProfileGate();
  if (!current.userId) return { ok: false, message: "Sign in to edit this club." };
  if (!current.onboardingCompleted) return { ok: false, message: "Complete onboarding before editing a club." };
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clubId)) {
    return { ok: false, message: "The selected club is invalid." };
  }
  const validation = validate(input);
  if (!validation.ok) return validation;

  try {
    const club = await updateClub(current.supabase, clubId, validation.data);
    revalidatePath("/clubs");
    revalidatePath(`/clubs/${club.slug}`);
    revalidatePath("/communities");
    return { ok: true, slug: club.slug };
  } catch (error) {
    return { ok: false, message: databaseMessage(error) };
  }
}
