export type Student = {
  name: string; username: string; initials: string; program: string; year: number;
  bio: string; skills: string[]; interests: string[]; available?: boolean; color: string;
  collaboration?: "Open to projects" | "Open to mentoring" | "Focused";
};

export type Community = {
  slug: string; name: string; description: string; members: number; category: string;
  accent: string; featured?: boolean; status?: "Founding" | "Forming" | "Active"; purpose?: string;
};

export type Project = {
  slug: string; name: string; tagline: string; description: string; status: "Idea" | "Building" | "Launched" | "Completed";
  category: string; technologies: string[]; lookingFor: string[]; creator: string; members: string[];
};

export type CampusEvent = {
  slug: string; title: string; description: string; date: string; day: string; month: string; time: string;
  location: string; category: string; organizer: string; attendees: number; capacity: number;
};

export type Opportunity = {
  id: string; organization: string; title: string; type: string; deadline: string; location: string; remote: boolean; description: string;
};

export type Resource = {
  id: string; title: string; description: string; category: string; author: string; authorUsername: string; tags: string[]; saves: number; type: string;
};

export type DemoPost = {
  id: string; authorUsername: string; context: string; createdAt: string; text: string;
  tags: string[]; likes: number; communitySlug?: string;
};

export type DemoComment = { id: string; authorUsername: string; text: string; createdAt: string };
export type DemoMessage = { id: string; sender: "me" | "them"; text: string; createdAt: string };
export type DemoConversation = { username: string; unread: number; messages: DemoMessage[] };
export type DemoNotification = {
  id: string; kind: "project" | "comment" | "follow" | "event" | "like" | "community";
  text: string; meta: string; href: string;
};

export type DemoProfile = Pick<Student, "name" | "username" | "program" | "year" | "bio" | "skills" | "interests" | "available">;
export type DemoState = {
  version: 2;
  profile: DemoProfile;
  createdPosts: DemoPost[];
  createdProjects: Project[];
  createdCommunities: Community[];
  createdEvents: CampusEvent[];
  createdResources: Resource[];
  likedPostIds: string[];
  bookmarkedPostIds: string[];
  comments: Record<string, DemoComment[]>;
  followedUsernames: string[];
  joinedCommunitySlugs: string[];
  attendingEventSlugs: string[];
  savedEventSlugs: string[];
  savedProjectSlugs: string[];
  savedOpportunityIds: string[];
  savedResourceIds: string[];
  projectApplications: Record<string, { role: string; message: string }>;
  conversations: DemoConversation[];
  readNotificationIds: string[];
  notificationPreferences: { projects: boolean; events: boolean; communityDigest: boolean };
  privacy: { profileVisibility: "campus" | "connections"; messagePermission: "everyone" | "connections"; projectInvitations: boolean };
  reduceMotion: boolean;
};
