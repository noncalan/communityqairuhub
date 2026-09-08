"use client";

import { Bookmark, Heart, MessageCircle, Plus, Send, Share2, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  createCommentAction,
  createPostAction,
  deleteCommentAction,
  setPostBookmarkedAction,
  setPostLikedAction,
} from "@/app/actions/content";
import { AvatarMark } from "@/components/shared/avatar-mark";
import { ClientNavLink } from "@/components/shared/client-nav-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import type { LiveComment, LivePost, PostCommunityOption } from "@/lib/data/posts";
import { cn } from "@/lib/utils";

function initials(fullName: string) {
  return fullName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function formattedDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Qyzylorda",
  }).format(new Date(value));
}

async function sharePost(post: LivePost) {
  const url = `${location.origin}/home?post=${post.id}`;
  try {
    if (navigator.share) await navigator.share({ title: "QAIRU Hub post", text: post.content, url });
    else {
      await navigator.clipboard.writeText(url);
      toast.success("Post link copied");
    }
  } catch {
    // Closing a native share sheet does not need an error toast.
  }
}

export function LivePostFeed({
  initialPosts,
  communities,
  currentUserId,
  fixedCommunityId = null,
  canPost = true,
  heading = "Recent activity",
  emptyTitle = "No posts yet",
  emptyDescription = "Share the first useful update, question or early idea.",
}: {
  initialPosts: LivePost[];
  communities: PostCommunityOption[];
  currentUserId: string;
  fixedCommunityId?: string | null;
  canPost?: boolean;
  heading?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const [posts, setPosts] = useState(initialPosts);
  return (
    <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div><p className="eyebrow">Your campus</p><h2 className="mt-1 text-xl font-semibold tracking-[-0.03em]">{heading}</h2></div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{posts.length} {posts.length === 1 ? "update" : "updates"}</span>
          {canPost && <LivePostDialog communities={communities} fixedCommunityId={fixedCommunityId} onCreated={(post) => setPosts((items) => [post, ...items.filter((item) => item.id !== post.id)])} />}
        </div>
      </div>
      {posts.length ? (
        <div className="surface divide-y rounded-lg">
          {posts.map((post) => <LivePostCard key={post.id} initialPost={post} currentUserId={currentUserId} />)}
        </div>
      ) : (
        <div className="surface rounded-lg border-dashed p-10 text-center">
          <h3 className="font-semibold">{emptyTitle}</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{emptyDescription}</p>
        </div>
      )}
    </section>
  );
}

export function LivePostDialog({
  communities,
  fixedCommunityId = null,
  onCreated,
}: {
  communities: PostCommunityOption[];
  fixedCommunityId?: string | null;
  onCreated?: (post: LivePost) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setPending(true);
    const result = await createPostAction({
      content: String(data.get("content") ?? ""),
      communityId: fixedCommunityId || String(data.get("communityId") ?? "") || null,
      tags: String(data.get("tags") ?? "").split(","),
    });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    onCreated?.(result.data);
    form.reset();
    setOpen(false);
    toast.success("Post published to the campus feed");
  }

  const fixedCommunity = communities.find((community) => community.id === fixedCommunityId);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline"><Plus className="size-4" />Post</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share with QAIRU</DialogTitle>
          <DialogDescription>Post an update, question or early idea. Your authenticated profile is always used as the author.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <label className="grid gap-1.5 text-sm font-medium">Post<Textarea name="content" required minLength={4} maxLength={5000} autoFocus placeholder="What are you building, learning or looking for?" className="min-h-32" /></label>
          {fixedCommunity ? (
            <div className="rounded-md bg-muted px-3 py-2 text-sm">Posting in <span className="font-semibold">{fixedCommunity.name}</span></div>
          ) : (
            <label className="grid gap-1.5 text-sm font-medium">Community (optional)<select name="communityId" className="h-10 rounded-md border bg-background px-3 text-sm"><option value="">QAIRU campus</option>{communities.map((community) => <option key={community.id} value={community.id}>{community.name}</option>)}</select></label>
          )}
          <label className="grid gap-1.5 text-sm font-medium">Tags (optional)<Input name="tags" maxLength={320} placeholder="AI, first prototype" /></label>
          <p className="text-xs text-muted-foreground">Image attachments are unavailable in this phase; no file will be uploaded silently.</p>
          <DialogFooter><Button type="submit" disabled={pending}><Send className="size-4" />{pending ? "Publishing…" : "Publish post"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LivePostCard({ initialPost, currentUserId }: { initialPost: LivePost; currentUserId: string }) {
  const [liked, setLiked] = useState(initialPost.isLiked);
  const [saved, setSaved] = useState(initialPost.isBookmarked);
  const [likeCount, setLikeCount] = useState(initialPost.likeCount);
  const [commentCount, setCommentCount] = useState(initialPost.commentCount);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<LiveComment[] | null>(null);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [commentPending, setCommentPending] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [likePending, setLikePending] = useState(false);
  const [savePending, setSavePending] = useState(false);
  const likeLock = useRef(false);
  const saveLock = useRef(false);
  const commentLock = useRef(false);

  async function toggleLike() {
    if (likeLock.current) return;
    likeLock.current = true;
    const next = !liked;
    setLiked(next);
    setLikeCount((count) => Math.max(0, count + (next ? 1 : -1)));
    setLikePending(true);
    const result = await setPostLikedAction({ postId: initialPost.id, shouldLike: next });
    setLikePending(false);
    likeLock.current = false;
    if (!result.ok) {
      setLiked(!next);
      setLikeCount((count) => Math.max(0, count + (next ? -1 : 1)));
      toast.error(result.error);
    }
  }

  async function toggleSave() {
    if (saveLock.current) return;
    saveLock.current = true;
    const next = !saved;
    setSaved(next);
    setSavePending(true);
    const result = await setPostBookmarkedAction({ postId: initialPost.id, shouldBookmark: next });
    setSavePending(false);
    saveLock.current = false;
    if (!result.ok) {
      setSaved(!next);
      toast.error(result.error);
      return;
    }
    toast.success(next ? "Post bookmarked" : "Bookmark removed");
  }

  async function loadComments() {
    setCommentsOpen(true);
    if (comments) return;
    setCommentsError(null);
    try {
      const response = await fetch(`/api/posts/${initialPost.id}/comments`, { cache: "no-store" });
      const payload = await response.json() as { comments?: LiveComment[]; error?: string };
      if (!response.ok || !payload.comments) throw new Error(payload.error ?? "Comments could not be loaded.");
      setComments(payload.comments);
    } catch (error) {
      setCommentsError(error instanceof Error ? error.message : "Comments could not be loaded.");
    }
  }

  async function submitComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (commentLock.current) return;
    commentLock.current = true;
    const form = event.currentTarget;
    const data = new FormData(form);
    setCommentPending(true);
    const result = await createCommentAction({ postId: initialPost.id, body: String(data.get("comment") ?? "") });
    setCommentPending(false);
    commentLock.current = false;
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setComments((items) => [...(items ?? []), result.data]);
    setCommentCount((count) => count + 1);
    form.reset();
    toast.success("Comment added");
  }

  async function removeComment(comment: LiveComment) {
    if (deletingCommentId) return;
    setDeletingCommentId(comment.id);
    const result = await deleteCommentAction({ commentId: comment.id });
    setDeletingCommentId(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setComments((items) => items?.filter((item) => item.id !== comment.id) ?? []);
    setCommentCount((count) => Math.max(0, count - 1));
    toast.success("Comment deleted");
  }

  const context = initialPost.community
    ? <ClientNavLink href={`/communities/${initialPost.community.slug}`} className="hover:text-foreground">{initialPost.community.name}</ClientNavLink>
    : "QAIRU campus";

  return (
    <article id={initialPost.id} className="p-5 sm:p-6">
      <div className="flex w-fit items-start gap-3">
        <AvatarMark initials={initials(initialPost.author.fullName)} color="#5367cb" className="size-9" />
        <div><ClientNavLink href={`/u/${initialPost.author.username}`} className="text-sm font-semibold hover:text-primary">{initialPost.author.fullName}</ClientNavLink><p className="text-[11px] text-muted-foreground">{context} · <time dateTime={initialPost.createdAt}>{formattedDate(initialPost.createdAt)}</time></p></div>
      </div>
      <p className="mt-4 max-w-2xl whitespace-pre-wrap text-sm leading-6">{initialPost.content}</p>
      {!!initialPost.tags.length && <div className="mt-3 flex flex-wrap gap-1.5">{initialPost.tags.map((tag) => <Badge key={tag} variant="secondary" className="font-normal">{tag}</Badge>)}</div>}
      <div className="mt-5 flex items-center gap-1 border-t pt-3">
        <Button size="sm" variant="ghost" onClick={toggleLike} disabled={likePending} aria-pressed={liked}><Heart className={cn("size-4", liked && "fill-primary text-primary")} />{likeCount}</Button>
        <Button size="sm" variant="ghost" onClick={loadComments}><MessageCircle className="size-4" />{commentCount}</Button>
        <Button size="icon-sm" variant="ghost" onClick={() => sharePost(initialPost)} aria-label="Share post"><Share2 className="size-4" /></Button>
        <Button className="ms-auto" size="icon-sm" variant="ghost" onClick={toggleSave} disabled={savePending} aria-label="Bookmark post" aria-pressed={saved}><Bookmark className={cn("size-4", saved && "fill-current text-primary")} /></Button>
      </div>
      <Dialog open={commentsOpen} onOpenChange={setCommentsOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Post discussion</DialogTitle><DialogDescription>{commentCount ? `${commentCount} ${commentCount === 1 ? "comment" : "comments"}` : "Start the conversation"}</DialogDescription></DialogHeader>
          <div className="max-h-72 space-y-3 overflow-y-auto">
            {comments === null && !commentsError && <div className="space-y-3">{[1, 2].map((item) => <Skeleton key={item} className="h-20 rounded-lg" />)}</div>}
            {commentsError && <div className="rounded-lg border border-destructive/30 p-4 text-sm text-destructive"><p>{commentsError}</p><Button size="sm" variant="outline" className="mt-3" onClick={() => { setComments(null); void loadComments(); }}>Try again</Button></div>}
            {comments?.map((comment) => <div key={comment.id} className="rounded-lg bg-muted p-3"><div className="flex items-start gap-3"><ClientNavLink href={`/u/${comment.author.username}`} className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{comment.author.fullName}</p><p className="mt-1 whitespace-pre-wrap text-sm">{comment.body}</p><time dateTime={comment.createdAt} className="mt-1 block text-[10px] text-muted-foreground">{formattedDate(comment.createdAt)}</time></ClientNavLink>{comment.author.id === currentUserId && <Button type="button" size="icon-sm" variant="ghost" onClick={() => removeComment(comment)} disabled={deletingCommentId === comment.id} aria-label="Delete comment"><Trash2 className="size-3.5" /></Button>}</div></div>)}
            {comments?.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No comments yet.</p>}
          </div>
          <form onSubmit={submitComment} className="flex gap-2"><Input name="comment" required maxLength={2000} placeholder="Add a constructive comment…" autoComplete="off" disabled={commentPending} /><DialogFooter><Button type="submit" disabled={commentPending}>{commentPending ? "Adding…" : "Comment"}</Button></DialogFooter></form>
        </DialogContent>
      </Dialog>
    </article>
  );
}
