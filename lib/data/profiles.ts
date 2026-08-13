import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/database";

type Client = SupabaseClient<Database>;
type ProfileRow = Tables<"profiles">;

export type ReferenceItem = { id: string; name: string };
export type ProfileReferences = {
  programs: ReferenceItem[];
  interests: ReferenceItem[];
  skills: ReferenceItem[];
};

export type LiveProfile = {
  id: string;
  username: string;
  fullName: string;
  bio: string;
  avatarUrl: string | null;
  programId: string | null;
  program: string;
  academicYear: number;
  interests: ReferenceItem[];
  skills: ReferenceItem[];
  availableForProjects: boolean;
  openToCollaboration: boolean;
  profileVisibility: "campus" | "private";
  onboardingCompleted: boolean;
  updatedAt: string;
};

const profileSelect = `
  *,
  programs(id, name),
  profile_interests(interests(id, name)),
  profile_skills(skills(id, name))
`;

type ProfileQueryRow = ProfileRow & {
  programs: ReferenceItem | null;
  profile_interests: Array<{ interests: ReferenceItem | null }>;
  profile_skills: Array<{ skills: ReferenceItem | null }>;
};

function mapProfile(row: ProfileQueryRow): LiveProfile {
  return {
    id: row.id,
    username: row.username,
    fullName: row.full_name,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    programId: row.program_id,
    program: row.programs?.name ?? "Program not selected",
    academicYear: row.academic_year,
    interests: row.profile_interests.flatMap((item) =>
      item.interests ? [item.interests] : [],
    ),
    skills: row.profile_skills.flatMap((item) =>
      item.skills ? [item.skills] : [],
    ),
    availableForProjects: row.available_for_projects,
    openToCollaboration: row.open_to_collaboration,
    profileVisibility: row.profile_visibility as "campus" | "private",
    onboardingCompleted: row.onboarding_completed,
    updatedAt: row.updated_at,
  };
}

export async function getProfileReferences(
  client: Client,
): Promise<ProfileReferences> {
  const [programs, interests, skills] = await Promise.all([
    client.from("programs").select("id, name").order("name").limit(250),
    client.from("interests").select("id, name").order("name").limit(250),
    client.from("skills").select("id, name").order("name").limit(250),
  ]);
  const error = programs.error ?? interests.error ?? skills.error;
  if (error) throw error;
  return {
    programs: programs.data ?? [],
    interests: interests.data ?? [],
    skills: skills.data ?? [],
  };
}

export async function getProfileById(client: Client, id: string) {
  const { data, error } = await client
    .from("profiles")
    .select(profileSelect)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapProfile(data as ProfileQueryRow) : null;
}

export async function getProfileGate(client: Client, id: string) {
  const { data, error } = await client
    .from("profiles")
    .select("username, onboarding_completed")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getProfileByUsername(
  client: Client,
  username: string,
) {
  const { data, error } = await client
    .from("profiles")
    .select(profileSelect)
    .eq("username", username.toLowerCase())
    .eq("onboarding_completed", true)
    .maybeSingle();
  if (error) throw error;
  return data ? mapProfile(data as ProfileQueryRow) : null;
}

export async function listCompletedProfiles(client: Client) {
  const { data, error } = await client
    .from("profiles")
    .select(profileSelect)
    .eq("onboarding_completed", true)
    .eq("profile_visibility", "campus")
    .order("full_name")
    .limit(200);
  if (error) throw error;
  return (data as ProfileQueryRow[]).map(mapProfile);
}

export type ProfileMutationInput = {
  username: string;
  fullName: string;
  bio: string;
  programId: string;
  academicYear: number;
  interestIds: string[];
  skillIds: string[];
  availableForProjects: boolean;
  openToCollaboration: boolean;
  profileVisibility: "campus" | "private";
};

export async function saveProfile(
  client: Client,
  userId: string,
  input: ProfileMutationInput,
  completeOnboarding: boolean,
) {
  const { error } = await client.rpc("save_my_profile", {
    profile_username: input.username,
    profile_full_name: input.fullName,
    profile_bio: input.bio,
    profile_program_id: input.programId,
    profile_academic_year: input.academicYear,
    profile_available_for_projects: input.availableForProjects,
    profile_open_to_collaboration: input.openToCollaboration,
    profile_visibility: input.profileVisibility,
    profile_onboarding_completed: completeOnboarding,
    interest_ids: input.interestIds,
    skill_ids: input.skillIds,
  });
  if (error) throw error;

  return getProfileById(client, userId);
}
