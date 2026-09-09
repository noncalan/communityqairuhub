"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfileGate } from "@/lib/auth/current-user";
import {
  applyToProject,
  createCommunity,
  createEvent,
  createProject,
  reviewProjectApplication,
  setCommunityMembership,
  setEventAttendance,
  setEventSaved,
  setFollow,
  setProjectSaved,
} from "@/lib/data/social";

export type SocialActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { data: T }))
  | { ok: false; error: string };

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function text(value: string, min: number, max: number, label: string) {
  const normalized = value.trim();
  if (normalized.length < min || normalized.length > max) {
    throw new Error(`${label} must be between ${min} and ${max} characters.`);
  }
  return normalized;
}

function uuid(value: string, label: string) {
  if (!uuidPattern.test(value)) throw new Error(`${label} is invalid.`);
  return value;
}

function slug(value: string, label: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized.length < 3 || normalized.length > 60 || !slugPattern.test(normalized)) {
    throw new Error(`${label} is invalid.`);
  }
  return normalized;
}

function uniqueList(
  values: string[],
  min: number,
  max: number,
  label: string,
  maximumItems = 20,
) {
  const result = [...new Set(values.map((value) => value.trim()).filter(Boolean))];
  if (result.length > maximumItems) {
    throw new Error(`${label} supports at most ${maximumItems} items.`);
  }
  if (result.some((value) => value.length < min || value.length > max)) {
    throw new Error(`${label} must each be between ${min} and ${max} characters.`);
  }
  return result;
}

function databaseMessage(error: unknown) {
  if (error instanceof Error && !("code" in error)) return error.message;
  if (typeof error !== "object" || !error) return "The request could not be completed.";
  const code = "code" in error ? String(error.code) : "";
  const message = "message" in error ? String(error.message) : "";
  if (message.includes("Event is at capacity")) return "This event has reached capacity.";
  if (message.includes("community owner cannot leave")) return "Transfer ownership before leaving this community.";
  if (message.includes("Rate limit exceeded")) return "Too many changes. Please wait and try again.";
  if (code === "23505" && message.includes("project_applications")) return "You already have a pending application for this project.";
  if (code === "23505" && message.includes("slug")) return "An item with this name already exists. Try a more specific name.";
  if (code === "23505") return "That action has already been completed.";
  if (code === "23514") return "Some details are outside the allowed range. Review the form and try again.";
  if (code === "23503") return "The selected item no longer exists. Refresh and try again.";
  if (code === "42501" || code === "PGRST116") return "You do not have permission to do that.";
  return "The request could not be completed. Please try again.";
}

async function authenticated() {
  const current = await getCurrentProfileGate();
  if (!current.userId) throw new Error("Your session expired. Sign in again.");
  if (!current.onboardingCompleted) throw new Error("Complete onboarding before continuing.");
  return { ...current, userId: current.userId };
}

function refresh(...paths: string[]) {
  for (const path of paths) revalidatePath(path);
}

export async function toggleFollowAction(input: {
  targetProfileId: string;
  targetUsername: string;
  shouldFollow: boolean;
}): Promise<SocialActionResult> {
  try {
    const { supabase, userId } = await authenticated();
    const targetProfileId = uuid(input.targetProfileId, "Profile");
    if (targetProfileId === userId) throw new Error("You cannot follow yourself.");
    await setFollow(supabase, userId, targetProfileId, Boolean(input.shouldFollow));
    refresh("/home", "/people", `/u/${input.targetUsername}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: databaseMessage(error) };
  }
}

export async function createCommunityAction(input: {
  name: string;
  category: string;
  description: string;
  status: "forming" | "active";
}): Promise<SocialActionResult<{ slug: string }>> {
  try {
    const { supabase, userId } = await authenticated();
    const status = input.status === "active" ? "active" : "forming";
    const community = await createCommunity(supabase, userId, {
      name: text(input.name, 3, 80, "Name"),
      category: text(input.category, 2, 60, "Category"),
      description: text(input.description, 8, 600, "Description"),
      status,
    });
    refresh("/home", "/communities", `/communities/${community.slug}`);
    return { ok: true, data: community };
  } catch (error) {
    return { ok: false, error: databaseMessage(error) };
  }
}

export async function setCommunityMembershipAction(input: {
  communityId: string;
  slug: string;
  shouldJoin: boolean;
}): Promise<SocialActionResult> {
  try {
    const { supabase, userId } = await authenticated();
    await setCommunityMembership(supabase, userId, uuid(input.communityId, "Community"), Boolean(input.shouldJoin));
    refresh("/home", "/communities", `/communities/${input.slug}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: databaseMessage(error) };
  }
}

export async function createProjectAction(input: {
  name: string;
  tagline: string;
  description: string;
  category: string;
  status: "idea" | "building" | "launched" | "completed";
  technologies: string[];
  rolesNeeded: string[];
}): Promise<SocialActionResult<{ slug: string }>> {
  try {
    const { supabase } = await authenticated();
    const validStatuses = new Set(["idea", "building", "launched", "completed"]);
    if (!validStatuses.has(input.status)) throw new Error("Project status is invalid.");
    const rolesNeeded = uniqueList(input.rolesNeeded, 2, 80, "Roles");
    if (!rolesNeeded.length) throw new Error("Add at least one role the project needs.");
    const project = await createProject(supabase, {
      name: text(input.name, 3, 100, "Name"),
      tagline: text(input.tagline, 5, 160, "Tagline"),
      description: text(input.description, 10, 3000, "Description"),
      category: text(input.category, 2, 60, "Category"),
      status: input.status,
      technologies: uniqueList(input.technologies, 1, 50, "Technologies"),
      rolesNeeded,
    });
    refresh("/home", "/projects", `/projects/${project.slug}`);
    return { ok: true, data: { slug: project.slug } };
  } catch (error) {
    return { ok: false, error: databaseMessage(error) };
  }
}

export async function applyToProjectAction(input: {
  projectId: string;
  projectRoleId: string;
  message: string;
  slug: string;
}): Promise<SocialActionResult> {
  try {
    const { supabase, userId } = await authenticated();
    const projectSlug = slug(input.slug, "Project");
    await applyToProject(supabase, userId, {
      projectId: uuid(input.projectId, "Project"),
      projectRoleId: uuid(input.projectRoleId, "Role"),
      message: text(input.message, 5, 1000, "Message"),
    });
    refresh("/find", "/projects", `/projects/${projectSlug}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: databaseMessage(error) };
  }
}

export async function reviewProjectApplicationAction(input: {
  applicationId: string;
  status: "accepted" | "rejected";
  slug: string;
}): Promise<SocialActionResult> {
  try {
    const { supabase } = await authenticated();
    if (input.status !== "accepted" && input.status !== "rejected") throw new Error("Review decision is invalid.");
    const projectSlug = slug(input.slug, "Project");
    await reviewProjectApplication(supabase, uuid(input.applicationId, "Application"), input.status);
    refresh("/find", "/projects", `/projects/${projectSlug}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: databaseMessage(error) };
  }
}

export async function setProjectSavedAction(input: {
  projectId: string;
  slug: string;
  shouldSave: boolean;
}): Promise<SocialActionResult> {
  try {
    const { supabase, userId } = await authenticated();
    await setProjectSaved(supabase, userId, uuid(input.projectId, "Project"), Boolean(input.shouldSave));
    refresh("/home", "/projects", `/projects/${input.slug}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: databaseMessage(error) };
  }
}

export async function createEventAction(input: {
  title: string;
  description: string;
  category: string;
  startsAt: string;
  endsAt: string;
  location: string;
  capacity: number;
}): Promise<SocialActionResult<{ slug: string }>> {
  try {
    const { supabase, userId } = await authenticated();
    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);
    if (!Number.isFinite(startsAt.getTime()) || !Number.isFinite(endsAt.getTime()) || endsAt <= startsAt) {
      throw new Error("End time must be after the event start time.");
    }
    if (!Number.isInteger(input.capacity) || input.capacity < 1 || input.capacity > 10_000) {
      throw new Error("Capacity must be between 1 and 10,000.");
    }
    const event = await createEvent(supabase, userId, {
      title: text(input.title, 3, 120, "Title"),
      description: text(input.description, 8, 2000, "Description"),
      category: text(input.category, 2, 60, "Category"),
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      location: text(input.location, 2, 160, "Location"),
      capacity: input.capacity,
    });
    refresh("/home", "/events", `/events/${event.slug}`);
    return { ok: true, data: event };
  } catch (error) {
    return { ok: false, error: databaseMessage(error) };
  }
}

export async function setEventAttendanceAction(input: {
  eventId: string;
  slug: string;
  shouldAttend: boolean;
}): Promise<SocialActionResult> {
  try {
    const { supabase, userId } = await authenticated();
    await setEventAttendance(supabase, userId, uuid(input.eventId, "Event"), Boolean(input.shouldAttend));
    refresh("/home", "/events", `/events/${input.slug}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: databaseMessage(error) };
  }
}

export async function setEventSavedAction(input: {
  eventId: string;
  slug: string;
  shouldSave: boolean;
}): Promise<SocialActionResult> {
  try {
    const { supabase, userId } = await authenticated();
    await setEventSaved(supabase, userId, uuid(input.eventId, "Event"), Boolean(input.shouldSave));
    refresh("/home", "/events", `/events/${input.slug}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: databaseMessage(error) };
  }
}
