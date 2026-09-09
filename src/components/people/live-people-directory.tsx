"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { AvatarMark } from "@/components/shared/avatar-mark";
import { MessageButton } from "@/components/messages/message-button";
import { FollowButton } from "@/components/social/follow-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrentUser } from "@/lib/auth/current-user-provider";
import type { DirectoryProfile } from "@/lib/data/profiles";
import { getFollowSnapshot, type FollowSnapshot } from "@/lib/data/social";
import { createClient } from "@/lib/supabase/client";
import { matchesPeopleFinderFilters } from "@/lib/team-finder/people-filter";

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export function LivePeopleDirectory({
  profiles,
  teamFinder = false,
}: {
  profiles: DirectoryProfile[];
  teamFinder?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [program, setProgram] = useState("All");
  const [skill, setSkill] = useState("All");
  const [interest, setInterest] = useState("All");
  const [academicYear, setAcademicYear] = useState("All");
  const [availability, setAvailability] = useState("All");
  const [collaboration, setCollaboration] = useState("All");
  const deferred = useDeferredValue(query.trim().toLowerCase());
  const { profile: currentProfile } = useCurrentUser();
  const [follows, setFollows] = useState<FollowSnapshot | null>(null);
  const visibleProfiles = useMemo(
    () => teamFinder
      ? profiles.filter((profile) => profile.id !== currentProfile.id)
      : profiles,
    [currentProfile.id, profiles, teamFinder],
  );
  const { programs, skills, interests, academicYears } = useMemo(() => ({
    programs: [...new Set(visibleProfiles.map((profile) => profile.program))].sort(),
    skills: [...new Set(visibleProfiles.flatMap((profile) => profile.skills.map((item) => item.name)))].sort(),
    interests: [...new Set(visibleProfiles.flatMap((profile) => profile.interests.map((item) => item.name)))].sort(),
    academicYears: [...new Set(visibleProfiles.map((profile) => profile.academicYear))].sort((a, b) => a - b),
  }), [visibleProfiles]);
  const filtered = useMemo(
    () =>
      visibleProfiles.filter((profile) => matchesPeopleFinderFilters(profile, {
        query: deferred,
        program,
        skill,
        interest,
        academicYear,
        availability,
        collaboration,
      })),
    [academicYear, availability, collaboration, deferred, interest, program, skill, visibleProfiles],
  );

  useEffect(() => {
    let active = true;
    void getFollowSnapshot(
      createClient(),
      currentProfile.id,
      visibleProfiles.map((profile) => profile.id),
    ).then((snapshot) => {
      if (active) setFollows(snapshot);
    }).catch(() => {
      // The directory remains usable if non-critical social counts cannot load.
    });
    return () => {
      active = false;
    };
  }, [currentProfile.id, visibleProfiles]);

  if (!visibleProfiles.length) {
    return (
      <div className="surface rounded-lg py-20 text-center">
        <h2 className="font-semibold">
          {teamFinder ? "No other students are discoverable yet." : "You’re among the first people on QAIRU Hub."}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Completed, campus-visible student profiles will appear here.
        </p>
      </div>
    );
  }

  function clear() {
    setQuery("");
    setProgram("All");
    setSkill("All");
    setInterest("All");
    setAcademicYear("All");
    setAvailability("All");
    setCollaboration("All");
  }

  return (
    <>
      <div className="mb-7 flex flex-wrap items-center gap-3 border-y py-4">
        <div className="relative w-full min-w-64 flex-1">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} className="ps-9 pe-9 shadow-none" placeholder="Search name, username, skill or interest" />
          {query && <button onClick={() => setQuery("")} className="absolute end-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground" aria-label="Clear search"><X className="size-3.5" /></button>}
        </div>
        <Filter label="Program" value={program} setValue={setProgram} options={programs} />
        <Filter label="Skill" value={skill} setValue={setSkill} options={skills} />
        <Filter label="Interest" value={interest} setValue={setInterest} options={interests} />
        {teamFinder ? (
          <>
            <Filter label="Academic year" value={academicYear} setValue={setAcademicYear} options={academicYears.map(String)} />
            <BooleanFilter label="Availability" value={availability} setValue={setAvailability} optionLabel="Open to projects" />
            <BooleanFilter label="Collaboration" value={collaboration} setValue={setCollaboration} optionLabel="Open to collaboration" />
          </>
        ) : null}
        <span className="text-xs text-muted-foreground lg:ms-auto" aria-live="polite">{filtered.length} results</span>
      </div>
      {filtered.length ? (
        <div className="grid gap-x-10 lg:grid-cols-2">
          {filtered.map((profile) => <LiveStudentCard key={profile.id} profile={profile} follows={follows} />)}
        </div>
      ) : (
        <div className="surface rounded-lg py-20 text-center">
          <Search className="mx-auto size-5 text-muted-foreground" />
          <h2 className="mt-4 font-semibold">
            {query ? `Nothing matched “${query}”` : "No people match these filters"}
          </h2>
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

function BooleanFilter({
  label,
  value,
  setValue,
  optionLabel,
}: {
  label: string;
  value: string;
  setValue: (value: string) => void;
  optionLabel: string;
}) {
  return (
    <select aria-label={`Filter by ${label.toLowerCase()}`} value={value} onChange={(event) => setValue(event.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm">
      <option value="All">All</option>
      <option value="true">{optionLabel}</option>
    </select>
  );
}

function LiveStudentCard({ profile, follows }: { profile: DirectoryProfile; follows: FollowSnapshot | null }) {
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
            {profile.openToCollaboration && <Badge variant="outline">Open to collaboration</Badge>}
          </div>
          <div className="mt-4 flex gap-2" onClick={(event) => event.stopPropagation()}>
            {own ? (
              <Button size="sm" variant="outline" onClick={() => router.push("/settings?tab=profile")}>Edit profile</Button>
            ) : (
              <>
                {follows ? (
                  <FollowButton
                    profileId={profile.id}
                    username={profile.username}
                    initialFollowing={follows.followingIds.includes(profile.id)}
                    initialFollowerCount={follows.followerCounts[profile.id] ?? 0}
                  />
                ) : <Button size="sm" disabled>Loading…</Button>}
                <MessageButton targetProfileId={profile.id} />
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
