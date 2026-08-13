import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;

export type CompactProfile = {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
};

export type FollowSnapshot = {
  followingIds: string[];
  followerCounts: Record<string, number>;
  followingCounts: Record<string, number>;
};

export type LiveCommunity = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  status: "forming" | "active";
  creator: CompactProfile;
  memberCount: number;
  currentRole: "owner" | "moderator" | "member" | null;
  members: Array<{
    profile: CompactProfile;
    role: "owner" | "moderator" | "member";
    joinedAt: string;
  }>;
};

export type LiveProject = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  status: "idea" | "building" | "launched" | "completed";
  creator: CompactProfile;
  technologies: string[];
  roles: Array<{ id: string; title: string; isOpen: boolean }>;
  members: Array<{
    profile: CompactProfile;
    roleTitle: string;
    canEdit: boolean;
    joinedAt: string;
  }>;
  memberCount: number;
  isCreator: boolean;
  isMember: boolean;
  isSaved: boolean;
  currentApplication: {
    id: string;
    projectRoleId: string;
    status: "pending" | "accepted" | "rejected" | "withdrawn";
  } | null;
  applications: Array<{
    id: string;
    applicant: CompactProfile;
    roleTitle: string;
    message: string;
    status: "pending" | "accepted" | "rejected" | "withdrawn";
    createdAt: string;
  }>;
};

export type LiveEvent = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  startsAt: string;
  endsAt: string;
  location: string;
  capacity: number;
  organizer: CompactProfile;
  attendees: CompactProfile[];
  attendeeCount: number;
  isOrganizer: boolean;
  isAttending: boolean;
  isSaved: boolean;
};

type ProfileRow = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
};

const compactProfile = (profile: ProfileRow): CompactProfile => ({
  id: profile.id,
  username: profile.username,
  fullName: profile.full_name,
  avatarUrl: profile.avatar_url,
});

const compactProfileSelect = "id, username, full_name, avatar_url";

function requireData<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw error;
  if (data === null) throw new Error("Requested data was not found.");
  return data;
}

export function slugifyLive(value: string) {
  const slug = value
    .normalize("NFKD")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
  return slug.length >= 3 ? slug : `qairu-${crypto.randomUUID().slice(0, 8)}`;
}

export async function getFollowSnapshot(
  client: Client,
  currentUserId: string,
  profileIds: string[],
): Promise<FollowSnapshot> {
  if (!profileIds.length) {
    return { followingIds: [], followerCounts: {}, followingCounts: {} };
  }
  const [following, followers, followedBy] = await Promise.all([
    client
      .from("follows")
      .select("following_id")
      .eq("follower_id", currentUserId),
    client
      .from("follows")
      .select("following_id")
      .in("following_id", profileIds),
    client
      .from("follows")
      .select("follower_id")
      .in("follower_id", profileIds),
  ]);
  const error = following.error ?? followers.error ?? followedBy.error;
  if (error) throw error;
  const followerCounts: Record<string, number> = {};
  const followingCounts: Record<string, number> = {};
  for (const id of profileIds) {
    followerCounts[id] = 0;
    followingCounts[id] = 0;
  }
  for (const row of followers.data ?? []) {
    followerCounts[row.following_id] = (followerCounts[row.following_id] ?? 0) + 1;
  }
  for (const row of followedBy.data ?? []) {
    followingCounts[row.follower_id] = (followingCounts[row.follower_id] ?? 0) + 1;
  }
  return {
    followingIds: (following.data ?? []).map((row) => row.following_id),
    followerCounts,
    followingCounts,
  };
}

export async function setFollow(
  client: Client,
  currentUserId: string,
  targetProfileId: string,
  shouldFollow: boolean,
) {
  if (shouldFollow) {
    const { error } = await client.from("follows").upsert(
      { follower_id: currentUserId, following_id: targetProfileId },
      { onConflict: "follower_id,following_id", ignoreDuplicates: true },
    );
    if (error) throw error;
  } else {
    const { error } = await client
      .from("follows")
      .delete()
      .eq("follower_id", currentUserId)
      .eq("following_id", targetProfileId);
    if (error) throw error;
  }
}

type CommunityQueryRow = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  status: "forming" | "active";
  creator: ProfileRow;
  community_members: Array<{
    profile_id: string;
    role: "owner" | "moderator" | "member";
    joined_at?: string;
    profile?: ProfileRow;
  }>;
};

function mapCommunity(
  row: CommunityQueryRow,
  currentUserId: string,
): LiveCommunity {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    description: row.description,
    status: row.status,
    creator: compactProfile(row.creator),
    memberCount: row.community_members.length,
    currentRole:
      row.community_members.find((member) => member.profile_id === currentUserId)
        ?.role ?? null,
    members: row.community_members.flatMap((member) =>
      member.profile && member.joined_at
        ? [{
            profile: compactProfile(member.profile),
            role: member.role,
            joinedAt: member.joined_at,
          }]
        : [],
    ),
  };
}

const communityListSelect = `
  id, slug, name, category, description, status,
  creator:profiles!communities_creator_id_fkey(${compactProfileSelect}),
  community_members(profile_id, role)
`;

const communityDetailSelect = `
  id, slug, name, category, description, status,
  creator:profiles!communities_creator_id_fkey(${compactProfileSelect}),
  community_members(
    profile_id, role, joined_at,
    profile:profiles!community_members_profile_id_fkey(${compactProfileSelect})
  )
`;

export async function listCommunities(client: Client, currentUserId: string) {
  const { data, error } = await client
    .from("communities")
    .select(communityListSelect)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data as unknown as CommunityQueryRow[]).map((row) =>
    mapCommunity(row, currentUserId),
  );
}

export async function getCommunityBySlug(
  client: Client,
  currentUserId: string,
  slug: string,
) {
  const { data, error } = await client
    .from("communities")
    .select(communityDetailSelect)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data
    ? mapCommunity(data as unknown as CommunityQueryRow, currentUserId)
    : null;
}

export async function createCommunity(
  client: Client,
  creatorId: string,
  input: {
    name: string;
    category: string;
    description: string;
    status: "forming" | "active";
  },
) {
  const slug = slugifyLive(input.name);
  const { data, error } = await client
    .from("communities")
    .insert({
      slug,
      name: input.name,
      category: input.category,
      description: input.description,
      status: input.status,
      creator_id: creatorId,
    })
    .select("slug")
    .single();
  return requireData(data, error);
}

export async function setCommunityMembership(
  client: Client,
  currentUserId: string,
  communityId: string,
  shouldJoin: boolean,
) {
  const query = shouldJoin
    ? client.from("community_members").insert({
        community_id: communityId,
        profile_id: currentUserId,
        role: "member",
      })
    : client
        .from("community_members")
        .delete()
        .eq("community_id", communityId)
        .eq("profile_id", currentUserId);
  const { error } = await query;
  if (error) throw error;
}

type ProjectBaseRow = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  status: "idea" | "building" | "launched" | "completed";
  creator: ProfileRow;
  project_technologies: Array<{ name: string }>;
  project_roles: Array<{ id: string; title: string; is_open: boolean }>;
  project_members: Array<{
    profile_id: string;
    role_title: string;
    can_edit: boolean;
    joined_at?: string;
    profile?: ProfileRow;
  }>;
  project_saves: Array<{ profile_id: string }>;
};

type ApplicationRow = {
  id: string;
  applicant_id: string;
  project_role_id: string;
  message: string;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  created_at: string;
};

const projectListSelect = `
  id, slug, name, tagline, description, category, status,
  creator:profiles!projects_creator_id_fkey(${compactProfileSelect}),
  project_technologies(name),
  project_roles(id, title, is_open),
  project_members(profile_id, role_title, can_edit),
  project_saves(profile_id)
`;

const projectDetailSelect = `
  id, slug, name, tagline, description, category, status,
  creator:profiles!projects_creator_id_fkey(${compactProfileSelect}),
  project_technologies(name),
  project_roles(id, title, is_open),
  project_members(
    profile_id, role_title, can_edit, joined_at,
    profile:profiles!project_members_profile_id_fkey(${compactProfileSelect})
  ),
  project_saves(profile_id)
`;

function mapProjectBase(
  row: ProjectBaseRow,
  currentUserId: string,
): Omit<LiveProject, "currentApplication" | "applications"> {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    category: row.category,
    status: row.status,
    creator: compactProfile(row.creator),
    technologies: row.project_technologies.map((item) => item.name),
    roles: row.project_roles.map((role) => ({
      id: role.id,
      title: role.title,
      isOpen: role.is_open,
    })),
    members: row.project_members.flatMap((member) =>
      member.profile && member.joined_at
        ? [{
            profile: compactProfile(member.profile),
            roleTitle: member.role_title,
            canEdit: member.can_edit,
            joinedAt: member.joined_at,
          }]
        : [],
    ),
    memberCount: row.project_members.length,
    isCreator: row.creator.id === currentUserId,
    isMember: row.project_members.some(
      (member) => member.profile_id === currentUserId,
    ),
    isSaved: row.project_saves.some(
      (save) => save.profile_id === currentUserId,
    ),
  };
}

export async function listProjects(client: Client, currentUserId: string) {
  const { data, error } = await client
    .from("projects")
    .select(projectListSelect)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data as unknown as ProjectBaseRow[]).map((row) => ({
    ...mapProjectBase(row, currentUserId),
    currentApplication: null,
    applications: [],
  }));
}

async function getProfilesByIds(client: Client, ids: string[]) {
  if (!ids.length) return new Map<string, CompactProfile>();
  const { data, error } = await client
    .from("profiles")
    .select(compactProfileSelect)
    .in("id", ids);
  if (error) throw error;
  return new Map(
    (data as ProfileRow[]).map((profile) => [
      profile.id,
      compactProfile(profile),
    ]),
  );
}

export async function getProjectBySlug(
  client: Client,
  currentUserId: string,
  slug: string,
) {
  const { data, error } = await client
    .from("projects")
    .select(projectDetailSelect)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as unknown as ProjectBaseRow;
  const { data: applicationData, error: applicationError } = await client
    .from("project_applications")
    .select("id, applicant_id, project_role_id, message, status, created_at")
    .eq("project_id", row.id)
    .order("created_at")
    .limit(100);
  if (applicationError) throw applicationError;
  const applications = (applicationData ?? []) as ApplicationRow[];
  const applicantProfiles = await getProfilesByIds(
    client,
    applications.map((application) => application.applicant_id),
  );
  const roles = new Map(
    row.project_roles.map((role) => [role.id, role.title]),
  );
  const mapped = mapProjectBase(row, currentUserId);
  return {
    ...mapped,
    currentApplication:
      applications
        .filter((application) => application.applicant_id === currentUserId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
        ? (() => {
            const application = applications
              .filter((item) => item.applicant_id === currentUserId)
              .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
            return {
              id: application.id,
              projectRoleId: application.project_role_id,
              status: application.status,
            };
          })()
        : null,
    applications: applications.flatMap((application) => {
      const applicant = applicantProfiles.get(application.applicant_id);
      return applicant
        ? [{
            id: application.id,
            applicant,
            roleTitle: roles.get(application.project_role_id) ?? "Contributor",
            message: application.message,
            status: application.status,
            createdAt: application.created_at,
          }]
        : [];
    }),
  } satisfies LiveProject;
}

export async function createProject(
  client: Client,
  input: {
    name: string;
    tagline: string;
    description: string;
    category: string;
    status: "idea" | "building" | "launched" | "completed";
    technologies: string[];
    rolesNeeded: string[];
  },
) {
  const slug = slugifyLive(input.name);
  const { data, error } = await client.rpc("create_project", {
    project_slug: slug,
    project_name: input.name,
    project_tagline: input.tagline,
    project_description: input.description,
    project_category: input.category,
    project_status: input.status,
    technologies: input.technologies,
    roles_needed: input.rolesNeeded,
  });
  if (error) throw error;
  return { id: data, slug };
}

export async function applyToProject(
  client: Client,
  currentUserId: string,
  input: { projectId: string; projectRoleId: string; message: string },
) {
  const { error } = await client.from("project_applications").insert({
    project_id: input.projectId,
    project_role_id: input.projectRoleId,
    applicant_id: currentUserId,
    message: input.message,
  });
  if (error) throw error;
}

export async function reviewProjectApplication(
  client: Client,
  applicationId: string,
  status: "accepted" | "rejected",
) {
  const { data, error } = await client
    .from("project_applications")
    .update({ status })
    .eq("id", applicationId)
    .select("project_id")
    .single();
  return requireData(data, error);
}

export async function setProjectSaved(
  client: Client,
  currentUserId: string,
  projectId: string,
  shouldSave: boolean,
) {
  const query = shouldSave
    ? client.from("project_saves").upsert(
        { profile_id: currentUserId, project_id: projectId },
        { onConflict: "profile_id,project_id", ignoreDuplicates: true },
      )
    : client
        .from("project_saves")
        .delete()
        .eq("profile_id", currentUserId)
        .eq("project_id", projectId);
  const { error } = await query;
  if (error) throw error;
}

type EventQueryRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  starts_at: string;
  ends_at: string;
  location: string;
  capacity: number;
  organizer: ProfileRow;
  event_attendees: Array<{ profile_id: string; profile?: ProfileRow }>;
  event_saves: Array<{ profile_id: string }>;
};

const eventListSelect = `
  id, slug, title, description, category, starts_at, ends_at, location, capacity,
  organizer:profiles!events_organizer_id_fkey(${compactProfileSelect}),
  event_attendees(profile_id),
  event_saves(profile_id)
`;

const eventDetailSelect = `
  id, slug, title, description, category, starts_at, ends_at, location, capacity,
  organizer:profiles!events_organizer_id_fkey(${compactProfileSelect}),
  event_attendees(
    profile_id,
    profile:profiles!event_attendees_profile_id_fkey(${compactProfileSelect})
  ),
  event_saves(profile_id)
`;

function mapEvent(row: EventQueryRow, currentUserId: string): LiveEvent {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    category: row.category,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    location: row.location,
    capacity: row.capacity,
    organizer: compactProfile(row.organizer),
    attendees: row.event_attendees.flatMap((attendee) =>
      attendee.profile ? [compactProfile(attendee.profile)] : [],
    ),
    attendeeCount: row.event_attendees.length,
    isOrganizer: row.organizer.id === currentUserId,
    isAttending: row.event_attendees.some(
      (attendee) => attendee.profile_id === currentUserId,
    ),
    isSaved: row.event_saves.some(
      (save) => save.profile_id === currentUserId,
    ),
  };
}

export async function listEvents(client: Client, currentUserId: string) {
  const { data, error } = await client
    .from("events")
    .select(eventListSelect)
    .order("starts_at")
    .limit(100);
  if (error) throw error;
  return (data as unknown as EventQueryRow[]).map((row) =>
    mapEvent(row, currentUserId),
  );
}

export async function getEventBySlug(
  client: Client,
  currentUserId: string,
  slug: string,
) {
  const { data, error } = await client
    .from("events")
    .select(eventDetailSelect)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data ? mapEvent(data as unknown as EventQueryRow, currentUserId) : null;
}

export async function createEvent(
  client: Client,
  organizerId: string,
  input: {
    title: string;
    description: string;
    category: string;
    startsAt: string;
    endsAt: string;
    location: string;
    capacity: number;
  },
) {
  const slug = slugifyLive(input.title);
  const { data, error } = await client
    .from("events")
    .insert({
      slug,
      title: input.title,
      description: input.description,
      category: input.category,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      location: input.location,
      capacity: input.capacity,
      organizer_id: organizerId,
    })
    .select("slug")
    .single();
  return requireData(data, error);
}

export async function setEventAttendance(
  client: Client,
  currentUserId: string,
  eventId: string,
  shouldAttend: boolean,
) {
  const query = shouldAttend
    ? client.from("event_attendees").insert({
        event_id: eventId,
        profile_id: currentUserId,
      })
    : client
        .from("event_attendees")
        .delete()
        .eq("event_id", eventId)
        .eq("profile_id", currentUserId);
  const { error } = await query;
  if (error) throw error;
}

export async function setEventSaved(
  client: Client,
  currentUserId: string,
  eventId: string,
  shouldSave: boolean,
) {
  const query = shouldSave
    ? client.from("event_saves").upsert(
        { profile_id: currentUserId, event_id: eventId },
        { onConflict: "profile_id,event_id", ignoreDuplicates: true },
      )
    : client
        .from("event_saves")
        .delete()
        .eq("profile_id", currentUserId)
        .eq("event_id", eventId);
  const { error } = await query;
  if (error) throw error;
}
