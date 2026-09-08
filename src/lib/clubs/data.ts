import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getAllowedClubLogoOrigins } from "@/lib/clubs/logo-origins";
import {
  firstRelated,
  managedClubIdentity,
  parsePublicClubRow,
  parsePublicClubRows,
  type InvalidClubContext,
} from "@/lib/clubs/parser";
import {
  type ClubInput,
  type ValidatedClubInput,
  validateClubInput,
} from "@/lib/clubs/validation";

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

const publicClubColumns = `
  id, slug, name, short_description, description, category, logo_url,
  leader_name, contact, status, telegram_bot_key, telegram_configured,
  telegram_group_url, telegram_public_username, created_at, updated_at
`;

function logInvalidClub(context: InvalidClubContext) {
  console.warn("[clubs] Ignoring invalid club data", context);
}

export async function listPublicClubs(client: Client) {
  const { data, error } = await client
    .from("public_clubs")
    .select(publicClubColumns)
    .order("name")
    .limit(200);
  if (error) throw error;
  return parsePublicClubRows(data ?? [], {
    allowedLogoOrigins: getAllowedClubLogoOrigins(),
  }, logInvalidClub);
}

export async function getPublicClubBySlug(client: Client, slug: string) {
  const { data, error } = await client
    .from("public_clubs")
    .select(publicClubColumns)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const parsed = parsePublicClubRow(data, {
    allowedLogoOrigins: getAllowedClubLogoOrigins(),
  });
  if (parsed.ok) return parsed.club;
  logInvalidClub({
    source: "public_clubs",
    ...managedClubIdentity(data),
    invalidFields: parsed.invalidFields,
  });
  return null;
}

export async function getPublicClubByBotKey(client: Client, botKey: string) {
  const { data, error } = await client
    .from("public_clubs")
    .select(publicClubColumns)
    .eq("telegram_bot_key", botKey)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const parsed = parsePublicClubRow(data, {
    allowedLogoOrigins: getAllowedClubLogoOrigins(),
  });
  if (parsed.ok) return parsed.club;
  logInvalidClub({
    source: "public_clubs",
    ...managedClubIdentity(data),
    invalidFields: parsed.invalidFields,
  });
  return null;
}

type ManagedClubRow = Database["public"]["Tables"]["communities"]["Row"] & {
  club_telegram_integrations: {
    group_url: string;
    public_username: string | null;
  } | Array<{
    group_url: string;
    public_username: string | null;
  }> | null;
  club_telegram_connections: { telegram_chat_id: string }
    | Array<{ telegram_chat_id: string }>
    | null;
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

  const integration = firstRelated(row.club_telegram_integrations);
  const connection = firstRelated(row.club_telegram_connections);
  const input: ClubInput = {
    name: row.name,
    slug: row.slug,
    shortDescription: row.short_description ?? row.description.slice(0, 180),
    description: row.description,
    category: row.category,
    logoUrl: row.logo_url ?? "",
    leaderName: row.leader_name ?? "Club organizer",
    contact: row.contact ?? "",
    status: row.status,
    telegramGroupUrl: integration?.group_url ?? "",
    telegramPublicUsername: integration?.public_username ?? "",
    telegramChatId: connection?.telegram_chat_id ?? "",
  };
  const validation = validateClubInput(input, {
    allowedLogoOrigins: getAllowedClubLogoOrigins(),
  });
  if (!validation.ok) {
    logInvalidClub({
      source: "managed_club",
      ...managedClubIdentity(row),
      invalidFields: Object.keys(validation.fieldErrors).sort(),
    });
    return null;
  }
  const value = validation.data;
  return {
    id: row.id,
    slug: value.slug,
    name: value.name,
    shortDescription: value.shortDescription,
    description: value.description,
    category: value.category,
    logoUrl: value.logoUrl,
    leaderName: value.leaderName,
    contact: value.contact,
    status: value.status,
    botKey: row.telegram_bot_key,
    telegramConfigured: Boolean(value.telegramGroupUrl),
    telegramGroupUrl: value.telegramGroupUrl,
    telegramPublicUsername: value.telegramPublicUsername,
    telegramChatId: value.telegramChatId,
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
