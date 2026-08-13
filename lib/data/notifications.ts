import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";

type Client = SupabaseClient<Database>;
type NotificationType = Database["public"]["Enums"]["notification_type"];

export type LiveNotification = {
  id: string;
  type: NotificationType;
  actor: {
    id: string;
    username: string;
    fullName: string;
    avatarUrl: string | null;
  } | null;
  entityType: string;
  entityId: string;
  payload: Json;
  readAt: string | null;
  createdAt: string;
  text: string;
  href: string;
};

type NotificationRow = {
  id: string;
  type: NotificationType;
  entity_type: string;
  entity_id: string;
  payload: Json;
  read_at: string | null;
  created_at: string;
  actor: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
};

function payloadString(payload: Json, key: string) {
  if (!payload || Array.isArray(payload) || typeof payload !== "object") return null;
  const value = payload[key];
  return typeof value === "string" ? value : null;
}

function notificationText(type: NotificationType, actorName: string) {
  switch (type) {
    case "new_follower": return `${actorName} started following you.`;
    case "post_comment": return `${actorName} commented on your post.`;
    case "post_like": return `${actorName} liked your post.`;
    case "project_application": return `${actorName} applied to your project.`;
    case "project_application_accepted": return `${actorName} accepted your project application.`;
    case "project_application_rejected": return `${actorName} declined your project application.`;
  }
}

function notificationHref(row: NotificationRow) {
  if (row.type === "new_follower") {
    return row.actor ? `/u/${row.actor.username}` : "/people";
  }
  if (row.type === "post_comment" || row.type === "post_like") {
    return `/home#${row.entity_id}`;
  }
  const slug = payloadString(row.payload, "project_slug");
  if (!slug) return "/projects";
  if (row.type === "project_application") {
    const applicationId = payloadString(row.payload, "application_id");
    return applicationId
      ? `/projects/${slug}?application=${applicationId}`
      : `/projects/${slug}`;
  }
  return `/projects/${slug}`;
}

function mapNotification(row: NotificationRow): LiveNotification {
  const actor = row.actor
    ? {
        id: row.actor.id,
        username: row.actor.username,
        fullName: row.actor.full_name,
        avatarUrl: row.actor.avatar_url,
      }
    : null;
  return {
    id: row.id,
    type: row.type,
    actor,
    entityType: row.entity_type,
    entityId: row.entity_id,
    payload: row.payload,
    readAt: row.read_at,
    createdAt: row.created_at,
    text: notificationText(row.type, actor?.fullName ?? "A QAIRU member"),
    href: notificationHref(row),
  };
}

const notificationSelect = `
  id, type, entity_type, entity_id, payload, read_at, created_at,
  actor:profiles!notifications_actor_id_fkey(id, username, full_name, avatar_url)
`;

export async function listNotifications(client: Client, limit = 50) {
  const { data, error } = await client
    .from("notifications")
    .select(notificationSelect)
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 100));
  if (error) throw error;
  return (data as unknown as NotificationRow[]).map(mapNotification);
}

export async function getUnreadNotificationCount(client: Client) {
  const { count, error } = await client
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);
  if (error) throw error;
  return count ?? 0;
}

export async function markNotificationRead(client: Client, notificationId: string) {
  const { error } = await client
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .is("read_at", null);
  if (error) throw error;
}

export async function markAllNotificationsRead(client: Client) {
  const { error } = await client
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);
  if (error) throw error;
}

export async function getActivityCounts(client: Client) {
  const [messages, notifications] = await Promise.all([
    getUnreadMessageCountFromRpc(client),
    getUnreadNotificationCount(client),
  ]);
  return { messages, notifications };
}

async function getUnreadMessageCountFromRpc(client: Client) {
  const { data, error } = await client.rpc("get_my_unread_message_count");
  if (error) throw error;
  return Number(data ?? 0);
}
