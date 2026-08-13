import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;

export type PostCommunityOption = {
  id: string;
  slug: string;
  name: string;
};

export type LivePost = {
  id: string;
  author: {
    id: string;
    username: string;
    fullName: string;
    avatarUrl: string | null;
  };
  content: string;
  community: PostCommunityOption | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
};

export type LiveComment = {
  id: string;
  postId: string;
  body: string;
  createdAt: string;
  author: LivePost["author"];
};

export type FeedCursor = { createdAt: string; id: string };

export type FeedPage = {
  items: LivePost[];
  nextCursor: FeedCursor | null;
};

type FeedRow = Database["public"]["Views"]["post_feed_items"]["Row"];

function mapPost(row: FeedRow): LivePost {
  if (
    !row.id || !row.author_id || !row.author_username || !row.author_full_name
    || !row.content || !row.created_at || !row.updated_at
  ) {
    throw new Error("A post returned incomplete feed data.");
  }
  return {
    id: row.id,
    author: {
      id: row.author_id,
      username: row.author_username,
      fullName: row.author_full_name,
      avatarUrl: row.author_avatar_url,
    },
    content: row.content,
    community: row.community_id && row.community_slug && row.community_name
      ? { id: row.community_id, slug: row.community_slug, name: row.community_name }
      : null,
    tags: row.tags ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    likeCount: row.like_count ?? 0,
    commentCount: row.comment_count ?? 0,
    isLiked: row.liked_by_current_user ?? false,
    isBookmarked: row.bookmarked_by_current_user ?? false,
  };
}

export async function listHomeFeed(
  client: Client,
  currentUserId: string,
  options: { limit?: number; before?: FeedCursor } = {},
): Promise<FeedPage> {
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 30);
  const [following, memberships] = await Promise.all([
    client.from("follows").select("following_id").eq("follower_id", currentUserId),
    client.from("community_members").select("community_id").eq("profile_id", currentUserId),
  ]);
  const relationError = following.error ?? memberships.error;
  if (relationError) throw relationError;

  const authorIds = [currentUserId, ...(following.data ?? []).map((row) => row.following_id)];
  const communityIds = (memberships.data ?? []).map((row) => row.community_id);
  const filters = [
    `author_id.in.(${authorIds.join(",")})`,
    "community_id.is.null",
    ...(communityIds.length ? [`community_id.in.(${communityIds.join(",")})`] : []),
  ];

  let query = client
    .from("post_feed_items")
    .select("*")
    .or(filters.join(","))
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);
  if (options.before) query = query.lt("created_at", options.before.createdAt);
  const { data, error } = await query;
  if (error) throw error;
  const rows = (data ?? []) as FeedRow[];
  const items = rows.slice(0, limit).map(mapPost);
  const last = items.at(-1);
  return {
    items,
    nextCursor: rows.length > limit && last
      ? { createdAt: last.createdAt, id: last.id }
      : null,
  };
}

export async function listCommunityPosts(
  client: Client,
  communityId: string,
  limit = 20,
): Promise<LivePost[]> {
  const { data, error } = await client
    .from("post_feed_items")
    .select("*")
    .eq("community_id", communityId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 30));
  if (error) throw error;
  return ((data ?? []) as FeedRow[]).map(mapPost);
}

export async function getPostById(client: Client, postId: string) {
  const { data, error } = await client
    .from("post_feed_items")
    .select("*")
    .eq("id", postId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapPost(data as FeedRow) : null;
}

export async function createPost(
  client: Client,
  authorId: string,
  input: { content: string; communityId: string | null; tags: string[] },
) {
  const { data, error } = await client
    .from("posts")
    .insert({
      author_id: authorId,
      content: input.content,
      community_id: input.communityId,
      tags: input.tags,
    })
    .select("id")
    .single();
  if (error) throw error;
  const post = await getPostById(client, data.id);
  if (!post) throw new Error("Published post could not be loaded.");
  return post;
}

export async function setPostLiked(
  client: Client,
  currentUserId: string,
  postId: string,
  shouldLike: boolean,
) {
  const query = shouldLike
    ? client.from("post_likes").upsert(
        { post_id: postId, user_id: currentUserId },
        { onConflict: "post_id,user_id", ignoreDuplicates: true },
      )
    : client.from("post_likes").delete().eq("post_id", postId).eq("user_id", currentUserId);
  const { error } = await query;
  if (error) throw error;
}

export async function setPostBookmarked(
  client: Client,
  currentUserId: string,
  postId: string,
  shouldBookmark: boolean,
) {
  const query = shouldBookmark
    ? client.from("post_bookmarks").upsert(
        { post_id: postId, user_id: currentUserId },
        { onConflict: "user_id,post_id", ignoreDuplicates: true },
      )
    : client.from("post_bookmarks").delete().eq("post_id", postId).eq("user_id", currentUserId);
  const { error } = await query;
  if (error) throw error;
}

type CommentRow = {
  id: string;
  post_id: string;
  body: string;
  created_at: string;
  author: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
};

const commentSelect = `
  id, post_id, body, created_at,
  author:profiles!comments_author_id_fkey(id, username, full_name, avatar_url)
`;

function mapComment(row: CommentRow): LiveComment {
  return {
    id: row.id,
    postId: row.post_id,
    body: row.body,
    createdAt: row.created_at,
    author: {
      id: row.author.id,
      username: row.author.username,
      fullName: row.author.full_name,
      avatarUrl: row.author.avatar_url,
    },
  };
}

export async function listPostComments(client: Client, postId: string) {
  const { data, error } = await client
    .from("comments")
    .select(commentSelect)
    .eq("post_id", postId)
    .order("created_at")
    .limit(100);
  if (error) throw error;
  return (data as unknown as CommentRow[]).map(mapComment);
}

export async function createComment(
  client: Client,
  authorId: string,
  postId: string,
  body: string,
) {
  const { data, error } = await client
    .from("comments")
    .insert({ author_id: authorId, post_id: postId, body })
    .select(commentSelect)
    .single();
  if (error) throw error;
  return mapComment(data as unknown as CommentRow);
}

export async function deleteComment(client: Client, commentId: string) {
  const { error } = await client.from("comments").delete().eq("id", commentId);
  if (error) throw error;
}
