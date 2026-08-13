"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { AvatarMark } from "@/components/shared/avatar-mark";
import { FollowButton } from "@/components/social/follow-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { LiveProfile } from "@/lib/data/profiles";

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export function LiveProfilePage({
  profile,
  own,
  following,
  followerCount,
  followingCount,
}: {
  profile: LiveProfile;
  own: boolean;
  following: boolean;
  followerCount: number;
  followingCount: number;
}) {
  const demoOnly = (action: string) =>
    toast.info(`${action} stays demo-only in this release; no database record was created.`);
  return (
    <div className="page-container">
      <div className="grid gap-10 xl:grid-cols-[1fr_290px]">
        <div>
          <header className="flex flex-col gap-5 border-b pb-8 sm:flex-row sm:items-start">
            <AvatarMark initials={initials(profile.fullName)} color="#4f5fc4" className="size-24" />
            <div className="flex-1">
              <p className="eyebrow">@{profile.username}</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">{profile.fullName}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{profile.program} · Year {profile.academicYear}</p>
              <p className="mt-4 max-w-xl text-sm leading-6">{profile.bio || "This student is still writing their bio."}</p>
            </div>
            <div className="flex gap-2">
              {own ? (
                <Button asChild><Link href="/settings?tab=profile">Edit profile</Link></Button>
              ) : (
                <>
                  <FollowButton
                    profileId={profile.id}
                    username={profile.username}
                    initialFollowing={following}
                    initialFollowerCount={followerCount}
                    showCount
                  />
                  <Button variant="outline" onClick={() => demoOnly("Messaging")}><MessageCircle className="size-4" />Message</Button>
                </>
              )}
            </div>
          </header>
          <section className="grid gap-8 border-b py-8 sm:grid-cols-2">
            <div>
              <p className="eyebrow mb-3">Skills</p>
              <div className="flex flex-wrap gap-2">{profile.skills.map((item) => <Badge key={item.id} variant="secondary">{item.name}</Badge>)}</div>
            </div>
            <div>
              <p className="eyebrow mb-3">Interests</p>
              <div className="flex flex-wrap gap-2">{profile.interests.map((item) => <Badge key={item.id} variant="outline">{item.name}</Badge>)}</div>
            </div>
          </section>
          <section className="py-8">
            <p className="eyebrow">Current work</p>
            <h2 className="mt-2 text-xl font-semibold">Projects and activity</h2>
            <div className="mt-5 rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              Live project activity will arrive in a later phase.
            </div>
          </section>
        </div>
        <aside>
          <div className="surface rounded-lg p-5">
            <p className="eyebrow">About</p>
            <dl className="mt-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 border-b pb-4"><div><dt className="text-muted-foreground">Followers</dt><dd className="mt-1 text-lg font-semibold">{followerCount}</dd></div><div><dt className="text-muted-foreground">Following</dt><dd className="mt-1 text-lg font-semibold">{followingCount}</dd></div></div>
              <div><dt className="text-muted-foreground">Availability</dt><dd className="mt-1 font-medium">{profile.availableForProjects ? "Open to projects" : "Focused on current work"}</dd></div>
              <div><dt className="text-muted-foreground">Collaboration</dt><dd className="mt-1 font-medium">{profile.openToCollaboration ? "Open to collaboration" : "Not accepting requests"}</dd></div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
