export type FilterableProfile = {
  fullName: string;
  username: string;
  program: string;
  academicYear: number;
  bio: string;
  skills: Array<{ name: string }>;
  interests: Array<{ name: string }>;
  availableForProjects: boolean;
  openToCollaboration: boolean;
};

export type PeopleFinderFilters = {
  query: string;
  program: string;
  skill: string;
  interest: string;
  academicYear: string;
  availability: string;
  collaboration: string;
};

export function matchesPeopleFinderFilters(
  profile: FilterableProfile,
  filters: PeopleFinderFilters,
) {
  const searchable = [
    profile.fullName,
    profile.username,
    profile.program,
    profile.bio,
    ...profile.skills.map((item) => item.name),
    ...profile.interests.map((item) => item.name),
  ].join(" ").toLowerCase();

  return (
    (!filters.query || searchable.includes(filters.query))
    && (filters.program === "All" || profile.program === filters.program)
    && (filters.skill === "All" || profile.skills.some((item) => item.name === filters.skill))
    && (filters.interest === "All" || profile.interests.some((item) => item.name === filters.interest))
    && (filters.academicYear === "All" || profile.academicYear === Number(filters.academicYear))
    && (filters.availability !== "true" || profile.availableForProjects)
    && (filters.collaboration !== "true" || profile.openToCollaboration)
  );
}
