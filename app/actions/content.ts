"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  createComment,
  createPost,
  deleteComment,
  setPostBookmarked,
  setPostLiked,
  type LiveComment,
  type LivePost,
} from "@/lib/data/posts";
import {
  createResource,
  setResourceSaved,
  type LiveResource,
  type ResourceType,
} from "@/lib/data/resources";

export type ContentActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { data: T }))
  | { ok: false; error: string };

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const resourceTypes = new Set<ResourceType>(["guide", "notes", "repository", "link", "document"]);

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

function tags(values: string[], maximum: number) {
  const result = [...new Set(values.map((value) => value.trim()).filter(Boolean))];
  if (result.length > maximum) throw new Error(`Add no more than ${maximum} tags.`);
  if (result.some((value) => value.length > 40)) throw new Error("Each tag must be 40 characters or fewer.");
  return result;
}

function externalUrl(value: string) {
  try {
    const url = new URL(value.trim());
    if ((url.protocol !== "https:" && url.protocol !== "http:") || url.username || url.password) throw new Error();
    return url.toString();
  } catch {
    throw new Error("Add a valid http or https source URL.");
  }
}

function databaseMessage(error: unknown) {
  if (error instanceof Error && !("code" in error)) return error.message;
  if (typeof error !== "object" || !error) return "The request could not be completed.";
  const code = "code" in error ? String(error.code) : "";
  const message = "message" in error ? String(error.message) : "";
  if (code === "23505") return "That action has already been completed.";
  if (code === "23514" || code === "22001") return "Some content is outside the allowed range.";
  if (code === "23503") return "The selected item no longer exists. Refresh and try again.";
  if (code === "42501" || message.toLowerCase().includes("row-level security")) {
    return "You do not have permission to do that.";
  }
  return "The request could not be completed. Please try again.";
}

async function authenticated() {
  const current = await getCurrentUser();
  if (!current.userId) throw new Error("Your session expired. Sign in again.");
  return { ...current, userId: current.userId };
}

function refreshPostPaths(communitySlug?: string | null) {
  revalidatePath("/home");
  if (communitySlug) revalidatePath(`/communities/${communitySlug}`);
}

export async function createPostAction(input: {
  content: string;
  communityId: string | null;
  tags: string[];
}): Promise<ContentActionResult<LivePost>> {
  try {
    const { supabase, userId } = await authenticated();
    const post = await createPost(supabase, userId, {
      content: text(input.content, 4, 5000, "Post"),
      communityId: input.communityId ? uuid(input.communityId, "Community") : null,
      tags: tags(input.tags, 8),
    });
    refreshPostPaths(post.community?.slug);
    return { ok: true, data: post };
  } catch (error) {
    return { ok: false, error: databaseMessage(error) };
  }
}

export async function setPostLikedAction(input: {
  postId: string;
  shouldLike: boolean;
}): Promise<ContentActionResult> {
  try {
    const { supabase, userId } = await authenticated();
    await setPostLiked(supabase, userId, uuid(input.postId, "Post"), Boolean(input.shouldLike));
    refreshPostPaths();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: databaseMessage(error) };
  }
}

export async function setPostBookmarkedAction(input: {
  postId: string;
  shouldBookmark: boolean;
}): Promise<ContentActionResult> {
  try {
    const { supabase, userId } = await authenticated();
    await setPostBookmarked(supabase, userId, uuid(input.postId, "Post"), Boolean(input.shouldBookmark));
    revalidatePath("/home");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: databaseMessage(error) };
  }
}

export async function createCommentAction(input: {
  postId: string;
  body: string;
}): Promise<ContentActionResult<LiveComment>> {
  try {
    const { supabase, userId } = await authenticated();
    const comment = await createComment(
      supabase,
      userId,
      uuid(input.postId, "Post"),
      text(input.body, 1, 2000, "Comment"),
    );
    refreshPostPaths();
    return { ok: true, data: comment };
  } catch (error) {
    return { ok: false, error: databaseMessage(error) };
  }
}

export async function deleteCommentAction(input: {
  commentId: string;
}): Promise<ContentActionResult> {
  try {
    const { supabase } = await authenticated();
    await deleteComment(supabase, uuid(input.commentId, "Comment"));
    refreshPostPaths();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: databaseMessage(error) };
  }
}

export async function createResourceAction(input: {
  title: string;
  description: string;
  type: ResourceType;
  category: string;
  tags: string[];
  externalUrl: string;
}): Promise<ContentActionResult<LiveResource>> {
  try {
    const { supabase, userId } = await authenticated();
    if (!resourceTypes.has(input.type)) throw new Error("Resource type is invalid.");
    const resource = await createResource(supabase, userId, {
      title: text(input.title, 3, 160, "Title"),
      description: text(input.description, 8, 4000, "Description"),
      type: input.type,
      category: text(input.category, 2, 80, "Category"),
      tags: tags(input.tags, 12),
      externalUrl: externalUrl(input.externalUrl),
    });
    revalidatePath("/resources");
    revalidatePath(`/resources/${resource.id}`);
    return { ok: true, data: resource };
  } catch (error) {
    return { ok: false, error: databaseMessage(error) };
  }
}

export async function setResourceSavedAction(input: {
  resourceId: string;
  shouldSave: boolean;
}): Promise<ContentActionResult> {
  try {
    const { supabase, userId } = await authenticated();
    const resourceId = uuid(input.resourceId, "Resource");
    await setResourceSaved(supabase, userId, resourceId, Boolean(input.shouldSave));
    revalidatePath("/resources");
    revalidatePath(`/resources/${resourceId}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: databaseMessage(error) };
  }
}
