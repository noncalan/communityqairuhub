import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;

export type LiveConversation = {
  id: string;
  otherProfile: {
    id: string;
    username: string;
    fullName: string;
    avatarUrl: string | null;
  };
  lastMessage: {
    id: string;
    body: string;
    senderId: string;
    createdAt: string;
  } | null;
  unreadCount: number;
  updatedAt: string;
};

export type LiveMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  body: string;
  createdAt: string;
};

export type MessagePage = {
  items: LiveMessage[];
  hasMore: boolean;
};

type MessageRow = Database["public"]["Tables"]["messages"]["Row"];

export function mapMessage(row: MessageRow): LiveMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    recipientId: row.recipient_id,
    body: row.body,
    createdAt: row.created_at,
  };
}

export async function listConversations(client: Client): Promise<LiveConversation[]> {
  const { data, error } = await client.rpc("list_my_conversations");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.conversation_id,
    otherProfile: {
      id: row.other_profile_id,
      username: row.other_username,
      fullName: row.other_full_name,
      avatarUrl: row.other_avatar_url,
    },
    lastMessage: row.last_message_id
      ? {
          id: row.last_message_id,
          body: row.last_message_body,
          senderId: row.last_message_sender_id,
          createdAt: row.last_message_created_at,
        }
      : null,
    unreadCount: Number(row.unread_count),
    updatedAt: row.updated_at,
  }));
}

export async function listMessages(
  client: Client,
  conversationId: string,
  options: { limit?: number; before?: string } = {},
): Promise<MessagePage> {
  const limit = Math.min(Math.max(options.limit ?? 30, 1), 50);
  let query = client
    .from("messages")
    .select("id, conversation_id, sender_id, recipient_id, body, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);
  if (options.before) query = query.lt("created_at", options.before);
  const { data, error } = await query;
  if (error) throw error;
  const rows = (data ?? []) as MessageRow[];
  return {
    items: rows.slice(0, limit).reverse().map(mapMessage),
    hasMore: rows.length > limit,
  };
}

export async function getOrCreateDirectConversation(
  client: Client,
  otherProfileId: string,
) {
  const { data, error } = await client.rpc("get_or_create_direct_conversation", {
    other_profile_id: otherProfileId,
  });
  if (error) throw error;
  return data;
}

export async function sendMessage(
  client: Client,
  conversationId: string,
  body: string,
) {
  const { data, error } = await client.rpc("send_message", {
    target_conversation_id: conversationId,
    message_body: body,
  });
  if (error) throw error;
  return mapMessage(data);
}

export async function markConversationRead(client: Client, conversationId: string) {
  const { error } = await client.rpc("mark_conversation_read", {
    target_conversation_id: conversationId,
  });
  if (error) throw error;
}

export async function getUnreadMessageCount(client: Client) {
  const { data, error } = await client.rpc("get_my_unread_message_count");
  if (error) throw error;
  return Number(data ?? 0);
}
