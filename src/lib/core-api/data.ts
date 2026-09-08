import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, TablesInsert, TablesUpdate } from "@/types/database";
import type { CoreResource, ValidatedPayload } from "./validation";

type Client = SupabaseClient<Database>;
type TableName = "profiles" | "events" | "communities" | "projects";

const tableByResource: Record<CoreResource, TableName> = {
  users: "profiles",
  events: "events",
  communities: "communities",
  projects: "projects",
};

// Every selection is an explicit response allowlist. In particular,
// communities.telegram_bot_key must never cross this API boundary.
const selectByResource: Record<CoreResource, string> = {
  users: "id, username, full_name, bio, avatar_url, program_id, academic_year, available_for_projects, open_to_collaboration, profile_visibility, onboarding_completed, created_at, updated_at",
  events: "id, slug, title, description, category, starts_at, ends_at, location, capacity, organizer_id, created_at, updated_at",
  communities: "id, slug, name, short_description, description, category, logo_url, leader_name, contact, status, creator_id, created_at, updated_at",
  projects: "id, slug, name, tagline, description, category, status, creator_id, created_at, updated_at",
};

export async function listCoreResources(
  client: Client,
  resource: CoreResource,
  pagination: { limit: number; offset: number },
) {
  const table = tableByResource[resource];
  const { data, error, count } = await client
    .from(table)
    .select(selectByResource[resource], { count: "exact" })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(pagination.offset, pagination.offset + pagination.limit - 1);
  if (error) throw error;
  return { data: data ?? [], total: count ?? 0 };
}

export async function getCoreResource(
  client: Client,
  resource: CoreResource,
  id: string,
) {
  const { data, error } = await client
    .from(tableByResource[resource])
    .select(selectByResource[resource])
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createCoreResource(
  client: Client,
  resource: CoreResource,
  payload: ValidatedPayload,
) {
  let result;
  switch (resource) {
    case "users":
      result = await client.from("profiles").insert(payload as TablesInsert<"profiles">).select(selectByResource.users).single();
      break;
    case "events":
      result = await client.from("events").insert(payload as TablesInsert<"events">).select(selectByResource.events).single();
      break;
    case "communities":
      result = await client.from("communities").insert(payload as TablesInsert<"communities">).select(selectByResource.communities).single();
      break;
    case "projects":
      result = await client.from("projects").insert(payload as TablesInsert<"projects">).select(selectByResource.projects).single();
      break;
  }
  if (result.error) throw result.error;
  const data = result.data as unknown as Record<string, unknown> | null;
  if (!data || typeof data.id !== "string") {
    throw new Error("Created Core resource did not return an id.");
  }
  return data as Record<string, unknown> & { id: string };
}

export async function updateCoreResource(
  client: Client,
  resource: CoreResource,
  id: string,
  payload: ValidatedPayload,
) {
  let result;
  switch (resource) {
    case "users":
      result = await client.from("profiles").update(payload as TablesUpdate<"profiles">).eq("id", id).select(selectByResource.users).maybeSingle();
      break;
    case "events":
      result = await client.from("events").update(payload as TablesUpdate<"events">).eq("id", id).select(selectByResource.events).maybeSingle();
      break;
    case "communities":
      result = await client.from("communities").update(payload as TablesUpdate<"communities">).eq("id", id).select(selectByResource.communities).maybeSingle();
      break;
    case "projects":
      result = await client.from("projects").update(payload as TablesUpdate<"projects">).eq("id", id).select(selectByResource.projects).maybeSingle();
      break;
  }
  if (result.error) throw result.error;
  return result.data;
}
