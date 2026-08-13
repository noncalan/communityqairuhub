"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { AvatarMark } from "@/components/shared/avatar-mark";
import { MessageButton } from "@/components/messages/message-button";
import { FollowButton } from "@/components/social/follow-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrentUser } from "@/lib/auth/current-user-provider";
import type { LiveProfile } from "@/lib/data/profiles";
import type { FollowSnapshot } from "@/lib/data/social";

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export function LivePeopleDirectory({ profiles, follows }: { profiles: LiveProfile[]; follows: FollowSnapshot }) {
  const [query, setQuery] = useState("");
  const [program, setProgram] = useState("All");
  const [skill, setSkill] = useState("All");
  const [interest, setInterest] = useState("All");
  const deferred = useDeferredValue(query.trim().toLowerCase());
  const programs = [...new Set(profiles.map((profile) => profile.program))];
  const skills = [...new Set(profiles.flatMap((profile) => profile.skills.map((item) => item.name)))];
  const interests = [...new Set(profiles.flatMap((profile) => profile.interests.map((item) => item.name)))];
  const filtered = useMemo(
    () =>
      profiles.filter((profile) => {
        const searchable = [
          profile.fullName,
          profile.username,
          profile.program,
          profile.bio,
          ...profile.skills.map((item) => item.name),
          ...profile.interests.map((item) => item.name),
        ].join(" ").toLowerCase();
        return (
          (!deferred || searchable.includes(deferred)) &&
          (program === "All" || profile.program === program) &&
          (skill === "All" || profile.skills.some((item) => item.name === skill)) &&
          (interest === "All" || profile.interests.some((item) => item.name === interest))
        );
      }),
    [deferred, interest, profiles, program, skill],
  );

  if (!profiles.length) {
    return (
      <div className="surface rounded-lg py-20 text-center">
        <h2 className="font-semibold">You’re among the first people on QAIRU Hub.</h2>
        <p className="mt-2 text-sm text-muted-foreground">Completed student profiles will appear here.</p>
      </div>
    );
  }

  function clear() {
    setQuery("");
    setProgram("All");
    setSkill("All");
    setInterest("All");
  }

  return (
    <>
      <div className="mb-7 flex flex-col gap-3 border-y py-4 lg:flex-row lg:items-center">
        <div className="relative max-w-xl flex-1">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} className="ps-9 pe-9 shadow-none" placeholder="Search name, username, skill or interest" />
          {query && <button onClick={() => setQuery("")} className="absolute end-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground" aria-label="Clear search"><X className="size-3.5" /></button>}
        </div>
        <Filter label="Program" value={program} setValue={setProgram} options={programs} />
        <Filter label="Skill" value={skill} setValue={setSkill} options={skills} />
        <Filter label="Interest" value={interest} setValue={setInterest} options={interests} />
        <span className="text-xs text-muted-foreground lg:ms-auto">{filtered.length} results</span>
      </div>
      {filtered.length ? (
        <div className="grid gap-x-10 lg:grid-cols-2">
          {filtered.map((profile) => <LiveStudentCard key={profile.id} profile={profile} follows={follows} />)}
        </div>
      ) : (
        <div className="surface rounded-lg py-20 text-center">
          <Search className="mx-auto size-5 text-muted-foreground" />
          <h2 className="mt-4 font-semibold">Nothing matched “{query}”</h2>
          <p className="mt-1 text-sm text-muted-foreground">Try broader filters or a different topic.</p>
          <Button className="mt-5" variant="outline" onClick={clear}>Clear filters</Button>
        </div>
      )}
    </>
  );
}

function Filter({ label, value, setValue, options }: { label: string; value: string; setValue: (value: string) => void; options: string[] }) {
  return (
    <select aria-label={`Filter by ${label.toLowerCase()}`} value={value} onChange={(event) => setValue(event.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm">
      <option>All</option>
      {options.map((option) => <option key={option}>{option}</option>)}
    </select>
  );
}

function LiveStudentCard({ profile, follows }: { profile: LiveProfile; follows: FollowSnapshot }) {
  const router = useRouter();
  const { profile: currentProfile } = useCurrentUser();
  const own = currentProfile.id === profile.id;
  const open = () => router.push(`/u/${profile.username}`);
  return (
    <article role="link" tabIndex={0} onClick={open} onKeyDown={(event) => event.key === "Enter" && open()} className="group cursor-pointer border-b py-5 first:pt-0 last:border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <div className="flex gap-4">
        <AvatarMark initials={initials(profile.fullName)} color="#4f5fc4" className="size-11" />
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold tracking-[-0.02em] group-hover:text-primary">{profile.fullName}</h2>
          <p className="text-xs text-muted-foreground">@{profile.username} · {profile.program}, Year {profile.academicYear}</p>
          <p className="mt-2 text-sm leading-5 text-muted-foreground">{profile.bio || "This student is still writing their bio."}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {profile.skills.map((item) => <Badge key={item.id} variant="secondary">{item.name}</Badge>)}
            {profile.availableForProjects && <Badge variant="outline">Open to projects</Badge>}
          </div>
          <div className="mt-4 flex gap-2" onClick={(event) => event.stopPropagation()}>
            {own ? (
              <Button size="sm" variant="outline" onClick={() => router.push("/settings?tab=profile")}>Edit profile</Button>
            ) : (
              <>
                <FollowButton
                  profileId={profile.id}
                  username={profile.username}
                  initialFollowing={follows.followingIds.includes(profile.id)}
                  initialFollowerCount={follows.followerCounts[profile.id] ?? 0}
                />
                <MessageButton targetProfileId={profile.id} />
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
