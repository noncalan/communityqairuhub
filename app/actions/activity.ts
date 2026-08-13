"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  getOrCreateDirectConversation,
  markConversationRead,
  sendMessage,
  type LiveMessage,
} from "@/lib/data/messages";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/data/notifications";

type ActivityActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { data: T }))
  | { ok: false; error: string };

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function uuid(value: string, label: string) {
  if (!uuidPattern.test(value)) throw new Error(`${label} is invalid.`);
  return value;
}

function message(value: string) {
  const normalized = value.trim();
  if (!normalized || normalized.length > 4000) {
    throw new Error("Messages must be between 1 and 4,000 characters.");
  }
  return normalized;
}

function databaseMessage(error: unknown) {
  if (error instanceof Error && !("code" in error)) return error.message;
  if (typeof error !== "object" || !error) return "The request could not be completed.";
  const code = "code" in error ? String(error.code) : "";
  const detail = "message" in error ? String(error.message) : "";
  if (code === "23503") return "That profile or conversation no longer exists.";
  if (code === "23514" || code === "22001") return "The message is empty or too long.";
  if (code === "42501" || detail.toLowerCase().includes("row-level security")) {
    return "You do not have permission to do that.";
  }
  return "The request could not be completed. Please try again.";
}

async function authenticated() {
  const current = await getCurrentUser();
  if (!current.userId) throw new Error("Your session expired. Sign in again.");
  return { ...current, userId: current.userId };
}

export async function openDirectConversationAction(input: {
  otherProfileId: string;
}): Promise<ActivityActionResult<{ conversationId: string }>> {
  try {
    const { supabase, userId } = await authenticated();
    const otherProfileId = uuid(input.otherProfileId, "Profile");
    if (otherProfileId === userId) throw new Error("You cannot message yourself.");
    const conversationId = await getOrCreateDirectConversation(supabase, otherProfileId);
    revalidatePath("/messages");
    return { ok: true, data: { conversationId } };
  } catch (error) {
    return { ok: false, error: databaseMessage(error) };
  }
}

export async function sendMessageAction(input: {
  conversationId: string;
  body: string;
}): Promise<ActivityActionResult<LiveMessage>> {
  try {
    const { supabase } = await authenticated();
    const sent = await sendMessage(
      supabase,
      uuid(input.conversationId, "Conversation"),
      message(input.body),
    );
    revalidatePath("/messages");
    return { ok: true, data: sent };
  } catch (error) {
    return { ok: false, error: databaseMessage(error) };
  }
}

export async function markConversationReadAction(input: {
  conversationId: string;
}): Promise<ActivityActionResult> {
  try {
    const { supabase } = await authenticated();
    await markConversationRead(supabase, uuid(input.conversationId, "Conversation"));
    return { ok: true };
  } catch (error) {
    return { ok: false, error: databaseMessage(error) };
  }
}

export async function markNotificationReadAction(input: {
  notificationId: string;
}): Promise<ActivityActionResult> {
  try {
    const { supabase } = await authenticated();
    await markNotificationRead(supabase, uuid(input.notificationId, "Notification"));
    revalidatePath("/notifications");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: databaseMessage(error) };
  }
}

export async function markAllNotificationsReadAction(): Promise<ActivityActionResult> {
  try {
    const { supabase } = await authenticated();
    await markAllNotificationsRead(supabase);
    revalidatePath("/notifications");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: databaseMessage(error) };
  }
}
