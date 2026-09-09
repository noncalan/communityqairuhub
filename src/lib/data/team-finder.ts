import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  buildProjectOpportunities,
  type ProjectApplicationSnapshot,
  type ProjectDiscoveryRow,
} from "@/lib/team-finder/project-opportunities";

type Client = SupabaseClient<Database>;

type ProjectRow = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  category: string;
  status: ProjectDiscoveryRow["status"];
  creator_id: string;
  creator: {
    id: string;
    username: string;
    full_name: string;
  } | null;
  project_technologies: Array<{ name: string }>;
  project_roles: Array<{ id: string; title: string; is_open: boolean }>;
  project_members: Array<{ profile_id: string }>;
};

type ApplicationRow = {
  project_id: string;
  project_role_id: string;
  status: ProjectApplicationSnapshot["status"];
  created_at: string;
};

const projectOpportunitySelect = `
  id, slug, name, tagline, category, status, creator_id,
  creator:profiles!projects_creator_id_fkey(id, username, full_name),
  project_technologies(name),
  project_roles!inner(id, title, is_open),
  project_members(profile_id)
`;

export async function listProjectOpportunities(
  client: Client,
  currentUserId: string,
) {
  const { data, error } = await client
    .from("projects")
    .select(projectOpportunitySelect)
    .eq("project_roles.is_open", true)
    .neq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;

  const rows = (data ?? []) as unknown as ProjectRow[];
  const projectIds = rows.map((row) => row.id);
  let applicationRows: ApplicationRow[] = [];

  if (projectIds.length) {
    const { data: applications, error: applicationError } = await client
      .from("project_applications")
      .select("project_id, project_role_id, status, created_at")
      .eq("applicant_id", currentUserId)
      .in("project_id", projectIds)
      .order("created_at", { ascending: false })
      .limit(200);
    if (applicationError) throw applicationError;
    applicationRows = (applications ?? []) as ApplicationRow[];
  }

  return buildProjectOpportunities(
    rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      tagline: row.tagline,
      category: row.category,
      status: row.status,
      creatorId: row.creator_id,
      creator: row.creator ? {
        id: row.creator.id,
        username: row.creator.username,
        fullName: row.creator.full_name,
      } : null,
      technologies: row.project_technologies.map((item) => item.name),
      roles: row.project_roles.map((role) => ({
        id: role.id,
        title: role.title,
        isOpen: role.is_open,
      })),
      memberIds: row.project_members.map((member) => member.profile_id),
    })),
    applicationRows.map((application) => ({
      projectId: application.project_id,
      projectRoleId: application.project_role_id,
      status: application.status,
      createdAt: application.created_at,
    })),
    currentUserId,
  );
}
