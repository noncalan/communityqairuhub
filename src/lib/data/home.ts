import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;

export type HomeCommunity = {
  id: string;
  slug: string;
  name: string;
  status: "forming" | "active";
  memberCount: number;
  currentRole: "owner" | "moderator" | "member" | null;
};

export type HomeProject = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  status: "idea" | "building" | "launched" | "completed";
  memberCount: number;
};

export type HomeEvent = {
  id: string;
  slug: string;
  title: string;
  startsAt: string;
  endsAt: string;
};

type HomeCommunityRow = {
  id: string;
  slug: string;
  name: string;
  status: HomeCommunity["status"];
  community_members: Array<{
    profile_id: string;
    role: NonNullable<HomeCommunity["currentRole"]>;
  }>;
};

type HomeProjectRow = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  status: HomeProject["status"];
  project_members: Array<{ profile_id: string }>;
};

type HomeEventRow = {
  id: string;
  slug: string;
  title: string;
  starts_at: string;
  ends_at: string;
};

export async function listHomeCommunities(client: Client, currentUserId: string) {
  const { data, error } = await client
    .from("communities")
    .select("id, slug, name, status, community_members(profile_id, role)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data as HomeCommunityRow[]).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    status: row.status,
    memberCount: row.community_members.length,
    currentRole:
      row.community_members.find((member) => member.profile_id === currentUserId)
        ?.role ?? null,
  }));
}

export async function listHomeProjects(client: Client) {
  const { data, error } = await client
    .from("projects")
    .select("id, slug, name, tagline, status, project_members(profile_id)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data as HomeProjectRow[]).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    status: row.status,
    memberCount: row.project_members.length,
  }));
}

export async function listHomeEvents(client: Client) {
  const { data, error } = await client
    .from("events")
    .select("id, slug, title, starts_at, ends_at")
    .order("starts_at")
    .limit(100);
  if (error) throw error;
  return (data as HomeEventRow[]).map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
  }));
}
