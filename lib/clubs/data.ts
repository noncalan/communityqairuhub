import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { ValidatedClubInput } from "@/lib/clubs/validation";

type Client = SupabaseClient<Database>;

export type PublicClub = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  category: string;
  logoUrl: string | null;
  leaderName: string;
  contact: string | null;
  status: "active";
  botKey: string;
  telegramConfigured: boolean;
  telegramGroupUrl: string | null;
  telegramPublicUsername: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ManagedClub = Omit<PublicClub, "status"> & {
  status: "forming" | "active";
  telegramChatId: string | null;
};

type PublicClubRow = Database["public"]["Views"]["public_clubs"]["Row"];

const publicClubColumns = `
  id, slug, name, short_description, description, category, logo_url,
  leader_name, contact, status, telegram_bot_key, telegram_configured,
  telegram_group_url, telegram_public_username, created_at, updated_at
`;

function mapPublicClub(row: PublicClubRow): PublicClub {
  return {
    id: row.id!,
    slug: row.slug!,
    name: row.name!,
    shortDescription: row.short_description!,
    description: row.description!,
    category: row.category!,
    logoUrl: row.logo_url,
    leaderName: row.leader_name!,
    contact: row.contact,
    status: "active",
    botKey: row.telegram_bot_key!,
    telegramConfigured: Boolean(row.telegram_configured),
    telegramGroupUrl: row.telegram_group_url,
    telegramPublicUsername: row.telegram_public_username,
    createdAt: row.created_at!,
    updatedAt: row.updated_at!,
  };
}

export async function listPublicClubs(client: Client) {
  const { data, error } = await client
    .from("public_clubs")
    .select(publicClubColumns)
    .order("name")
    .limit(200);
  if (error) throw error;
  return (data as PublicClubRow[]).map(mapPublicClub);
}

export async function getPublicClubBySlug(client: Client, slug: string) {
  const { data, error } = await client
    .from("public_clubs")
    .select(publicClubColumns)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data ? mapPublicClub(data as PublicClubRow) : null;
}

export async function getPublicClubByBotKey(client: Client, botKey: string) {
  const { data, error } = await client
    .from("public_clubs")
    .select(publicClubColumns)
    .eq("telegram_bot_key", botKey)
    .maybeSingle();
  if (error) throw error;
  return data ? mapPublicClub(data as PublicClubRow) : null;
}

type ManagedClubRow = Database["public"]["Tables"]["communities"]["Row"] & {
  club_telegram_integrations: Array<{
    group_url: string;
    public_username: string | null;
  }>;
  club_telegram_connections: Array<{ telegram_chat_id: string }>;
};

export async function getManagedClubBySlug(
  client: Client,
  userId: string,
  slug: string,
) {
  const { data, error } = await client
    .from("communities")
    .select(`
      id, slug, name, short_description, description, category, logo_url,
      leader_name, contact, status, creator_id, telegram_bot_key,
      created_at, updated_at,
      club_telegram_integrations(group_url, public_username),
      club_telegram_connections(telegram_chat_id)
    `)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const row = data as unknown as ManagedClubRow;
  let canManage = row.creator_id === userId;
  if (!canManage) {
    const membership = await client
      .from("community_members")
      .select("role")
      .eq("community_id", row.id)
      .eq("profile_id", userId)
      .in("role", ["owner", "moderator"])
      .maybeSingle();
    if (membership.error) throw membership.error;
    canManage = Boolean(membership.data);
  }
  if (!canManage) return null;

  const integration = row.club_telegram_integrations[0] ?? null;
  const connection = row.club_telegram_connections[0] ?? null;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.short_description ?? row.description.slice(0, 180),
    description: row.description,
    category: row.category,
    logoUrl: row.logo_url,
    leaderName: row.leader_name ?? "Club organizer",
    contact: row.contact,
    status: row.status,
    botKey: row.telegram_bot_key,
    telegramConfigured: Boolean(integration),
    telegramGroupUrl: integration?.group_url ?? null,
    telegramPublicUsername: integration?.public_username ?? null,
    telegramChatId: connection?.telegram_chat_id ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  } satisfies ManagedClub;
}

function rpcArgs(input: ValidatedClubInput) {
  return {
    club_slug: input.slug,
    club_name: input.name,
    club_short_description: input.shortDescription,
    club_description: input.description,
    club_category: input.category,
    club_logo_url: input.logoUrl,
    club_leader_name: input.leaderName,
    club_contact: input.contact,
    club_status: input.status,
    telegram_group_url: input.telegramGroupUrl,
    telegram_public_username: input.telegramPublicUsername,
    telegram_chat_id: input.telegramChatId,
  };
}

export async function createClub(client: Client, input: ValidatedClubInput) {
  const { data, error } = await client.rpc("create_university_club", rpcArgs(input));
  if (error) throw error;
  return { slug: data };
}

export async function updateClub(
  client: Client,
  clubId: string,
  input: ValidatedClubInput,
) {
  const { data, error } = await client.rpc("update_university_club", {
    club_id: clubId,
    ...rpcArgs(input),
  });
  if (error) throw error;
  return { slug: data };
}
