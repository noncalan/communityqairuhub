import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;
export type ResourceType = Database["public"]["Enums"]["resource_type"];

export type LiveResource = {
  id: string;
  author: {
    id: string;
    username: string;
    fullName: string;
    avatarUrl: string | null;
  };
  title: string;
  description: string;
  type: ResourceType;
  category: string;
  tags: string[];
  externalUrl: string | null;
  storageObjectPath: string | null;
  createdAt: string;
  updatedAt: string;
  saveCount: number;
  isSaved: boolean;
};

type ResourceRow = Database["public"]["Views"]["resource_items"]["Row"];

function mapResource(row: ResourceRow): LiveResource {
  if (
    !row.id || !row.author_id || !row.author_username || !row.author_full_name
    || !row.title || !row.description || !row.type || !row.category
    || !row.created_at || !row.updated_at
  ) {
    throw new Error("A resource returned incomplete data.");
  }
  return {
    id: row.id,
    author: {
      id: row.author_id,
      username: row.author_username,
      fullName: row.author_full_name,
      avatarUrl: row.author_avatar_url,
    },
    title: row.title,
    description: row.description,
    type: row.type,
    category: row.category,
    tags: row.tags ?? [],
    externalUrl: row.external_url,
    storageObjectPath: row.storage_object_path,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    saveCount: row.save_count ?? 0,
    isSaved: row.saved_by_current_user ?? false,
  };
}

export async function listResources(client: Client, limit = 30) {
  const { data, error } = await client
    .from("resource_items")
    .select("*")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 50));
  if (error) throw error;
  return ((data ?? []) as ResourceRow[]).map(mapResource);
}

export async function getResourceById(client: Client, resourceId: string) {
  const { data, error } = await client
    .from("resource_items")
    .select("*")
    .eq("id", resourceId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapResource(data as ResourceRow) : null;
}

export async function createResource(
  client: Client,
  authorId: string,
  input: {
    title: string;
    description: string;
    type: ResourceType;
    category: string;
    tags: string[];
    externalUrl: string;
  },
) {
  const { data, error } = await client
    .from("resources")
    .insert({
      author_id: authorId,
      title: input.title,
      description: input.description,
      type: input.type,
      category: input.category,
      tags: input.tags,
      external_url: input.externalUrl,
    })
    .select("id")
    .single();
  if (error) throw error;
  const resource = await getResourceById(client, data.id);
  if (!resource) throw new Error("Shared resource could not be loaded.");
  return resource;
}

export async function setResourceSaved(
  client: Client,
  currentUserId: string,
  resourceId: string,
  shouldSave: boolean,
) {
  const query = shouldSave
    ? client.from("resource_saves").upsert(
        { resource_id: resourceId, user_id: currentUserId },
        { onConflict: "resource_id,user_id", ignoreDuplicates: true },
      )
    : client.from("resource_saves").delete().eq("resource_id", resourceId).eq("user_id", currentUserId);
  const { error } = await query;
  if (error) throw error;
}
