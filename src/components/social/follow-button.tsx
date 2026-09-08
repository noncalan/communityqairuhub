"use client";

import { useState, useTransition } from "react";
import { UserCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { toggleFollowAction } from "@/app/actions/social";
import { Button } from "@/components/ui/button";

export function FollowButton({
  profileId,
  username,
  initialFollowing,
  initialFollowerCount,
  showCount = false,
}: {
  profileId: string;
  username: string;
  initialFollowing: boolean;
  initialFollowerCount: number;
  showCount?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [following, setFollowing] = useState(initialFollowing);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);

  function toggle() {
    const next = !following;
    setFollowing(next);
    setFollowerCount((count) => Math.max(0, count + (next ? 1 : -1)));
    startTransition(async () => {
      const result = await toggleFollowAction({
        targetProfileId: profileId,
        targetUsername: username,
        shouldFollow: next,
      });
      if (!result.ok) {
        setFollowing(!next);
        setFollowerCount((count) => Math.max(0, count + (next ? -1 : 1)));
        toast.error(result.error);
        return;
      }
      toast.success(next ? "Now following" : "Unfollowed");
    });
  }

  return (
    <Button
      size="sm"
      variant={following ? "outline" : "default"}
      onClick={toggle}
      disabled={pending}
      aria-pressed={following}
    >
      {following ? <UserCheck className="size-3.5" /> : <UserPlus className="size-3.5" />}
      {pending ? "Saving…" : following ? "Following" : "Follow"}
      {showCount && <span className="opacity-60">{followerCount}</span>}
    </Button>
  );
}
