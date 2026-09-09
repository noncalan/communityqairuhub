export type ProjectApplicationStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "withdrawn";

export type ProjectOpportunityState =
  | "not_applied"
  | ProjectApplicationStatus
  | "owner"
  | "member";

export type ProjectDiscoveryRow = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  category: string;
  status: "idea" | "building" | "launched" | "completed";
  creatorId: string;
  creator: {
    id: string;
    username: string;
    fullName: string;
  } | null;
  technologies: string[];
  roles: Array<{ id: string; title: string; isOpen: boolean }>;
  memberIds: string[];
};

export type ProjectApplicationSnapshot = {
  projectId: string;
  projectRoleId: string;
  status: ProjectApplicationStatus;
  createdAt: string;
};

export type ProjectOpportunity = {
  roleId: string;
  roleTitle: string;
  projectId: string;
  projectSlug: string;
  projectName: string;
  projectSummary: string;
  projectCategory: string;
  projectStatus: ProjectDiscoveryRow["status"];
  technologies: string[];
  owner: ProjectDiscoveryRow["creator"];
  memberCount: number;
  state: ProjectOpportunityState;
  applicationRoleId: string | null;
  canApply: boolean;
};

export function buildProjectOpportunities(
  projects: ProjectDiscoveryRow[],
  applications: ProjectApplicationSnapshot[],
  currentUserId: string,
): ProjectOpportunity[] {
  const latestApplicationByProject = new Map<
    string,
    ProjectApplicationSnapshot
  >();

  for (const application of applications) {
    const current = latestApplicationByProject.get(application.projectId);
    if (!current || application.createdAt > current.createdAt) {
      latestApplicationByProject.set(application.projectId, application);
    }
  }

  return projects.flatMap((project) => {
    if (project.status === "completed") return [];

    const application = latestApplicationByProject.get(project.id) ?? null;
    const state: ProjectOpportunityState =
      project.creatorId === currentUserId
        ? "owner"
        : project.memberIds.includes(currentUserId)
          ? "member"
          : application?.status ?? "not_applied";
    const canApply =
      state === "not_applied" || state === "rejected" || state === "withdrawn";

    return project.roles
      .filter((role) => role.isOpen)
      .map((role) => ({
        roleId: role.id,
        roleTitle: role.title,
        projectId: project.id,
        projectSlug: project.slug,
        projectName: project.name,
        projectSummary: project.tagline,
        projectCategory: project.category,
        projectStatus: project.status,
        technologies: project.technologies,
        owner: project.creator,
        memberCount: project.memberIds.length,
        state,
        applicationRoleId: application?.projectRoleId ?? null,
        canApply,
      }));
  });
}
