"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Bookmark, CalendarDays, Clock, Code2, MapPin, Share2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  applyToProjectAction,
  reviewProjectApplicationAction,
  setCommunityMembershipAction,
  setEventAttendanceAction,
  setEventSavedAction,
  setProjectSavedAction,
} from "@/app/actions/social";
import { AvatarMark } from "@/components/shared/avatar-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { CompactProfile, LiveCommunity, LiveEvent, LiveProject } from "@/lib/data/social";
import { cn } from "@/lib/utils";

function initials(profile: CompactProfile) {
  return profile.fullName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

async function share(title: string, path: string) {
  const url = `${location.origin}${path}`;
  try {
    if (navigator.share) await navigator.share({ title, url });
    else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    }
  } catch {
    // Closing the native share sheet is not an error the user needs to see.
  }
}

function PhaseEmpty({ children }: { children: React.ReactNode }) {
  return <div className="surface mt-4 rounded-lg border-dashed p-10 text-center text-sm text-muted-foreground">{children}</div>;
}

export function LiveCommunityDetail({ community }: { community: LiveCommunity }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [role, setRole] = useState(community.currentRole);
  const [memberCount, setMemberCount] = useState(community.memberCount);
  const isMember = role === "member";
  const canToggle = role === null || isMember;

  function toggleMembership() {
    if (!canToggle) return;
    const nextJoin = role === null;
    const previousRole = role;
    setRole(nextJoin ? "member" : null);
    setMemberCount((count) => Math.max(0, count + (nextJoin ? 1 : -1)));
    startTransition(async () => {
      const result = await setCommunityMembershipAction({ communityId: community.id, slug: community.slug, shouldJoin: nextJoin });
      if (!result.ok) {
        setRole(previousRole);
        setMemberCount((count) => Math.max(0, count + (nextJoin ? -1 : 1)));
        toast.error(result.error);
        return;
      }
      toast.success(nextJoin ? "Joined community" : "Left community");
      router.refresh();
    });
  }

  return (
    <div>
      <div className="h-44 bg-[linear-gradient(135deg,#5b6fd8,#111827)] sm:h-56" />
      <div className="page-container -mt-12">
        <header className="surface relative rounded-lg p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
            <div className="grid size-20 place-items-center rounded-lg border-4 border-card bg-primary text-2xl font-semibold text-primary-foreground">{community.name.split(/\s+/).map((item) => item[0]).slice(0, 2).join("").toUpperCase()}</div>
            <div className="flex-1"><div className="flex flex-wrap items-center gap-2"><p className="eyebrow">{community.category} community</p><Badge variant="secondary" className="capitalize">{community.status}</Badge></div><h1 className="mt-1 text-3xl font-semibold">{community.name}</h1><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{community.description}</p></div>
            <Button variant={role ? "outline" : "default"} onClick={toggleMembership} disabled={pending || !canToggle}>{pending ? "Saving…" : role === "owner" ? "Owner" : role === "moderator" ? "Moderator" : role === "member" ? "Leave" : "Join"}</Button>
          </div>
          <p className="mt-6 border-t pt-4 text-xs text-muted-foreground">{memberCount} {memberCount === 1 ? "member" : "members"} · Created by <Link href={`/u/${community.creator.username}`} className="font-medium text-foreground hover:text-primary">{community.creator.fullName}</Link></p>
        </header>
        <Tabs defaultValue="members" className="mt-8">
          <TabsList><TabsTrigger value="members">Members</TabsTrigger><TabsTrigger value="posts">Posts</TabsTrigger><TabsTrigger value="events">Events</TabsTrigger><TabsTrigger value="resources">Resources</TabsTrigger></TabsList>
          <TabsContent value="members" className="mt-4 grid gap-3 sm:grid-cols-2">{community.members.map((member) => <Link key={member.profile.id} href={`/u/${member.profile.username}`} className="surface flex items-center gap-3 rounded-lg p-4"><AvatarMark initials={initials(member.profile)} color="#4f5fc4" className="size-9" /><span className="min-w-0 flex-1 truncate text-sm font-medium">{member.profile.fullName}</span><Badge variant="outline" className="capitalize">{member.role}</Badge></Link>)}</TabsContent>
          <TabsContent value="posts"><PhaseEmpty>Community posts are intentionally still demo-only in Phase 2B-1.</PhaseEmpty></TabsContent>
          <TabsContent value="events"><PhaseEmpty>Community-specific events will be connected in a later phase.</PhaseEmpty></TabsContent>
          <TabsContent value="resources"><PhaseEmpty>Community resources remain demo-only and no fictional records are shown here.</PhaseEmpty></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export function LiveProjectDetail({ project }: { project: LiveProject }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(project.isSaved);
  const [applicationStatus, setApplicationStatus] = useState(project.currentApplication?.status ?? null);
  const [applications, setApplications] = useState(project.applications);
  const openRoles = project.roles.filter((role) => role.isOpen);
  const canApply = !project.isCreator && !project.isMember && openRoles.length > 0 && applicationStatus !== "pending" && applicationStatus !== "accepted";

  function toggleSave() {
    const next = !saved;
    setSaved(next);
    startTransition(async () => {
      const result = await setProjectSavedAction({ projectId: project.id, slug: project.slug, shouldSave: next });
      if (!result.ok) {
        setSaved(!next);
        toast.error(result.error);
        return;
      }
      toast.success(next ? "Project saved" : "Removed from saved projects");
      router.refresh();
    });
  }

  function apply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const roleId = String(data.get("role") ?? "");
    const message = String(data.get("message") ?? "");
    startTransition(async () => {
      const result = await applyToProjectAction({ projectId: project.id, projectRoleId: roleId, message, slug: project.slug });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setApplicationStatus("pending");
      setDialogOpen(false);
      toast.success("Application sent");
      router.refresh();
    });
  }

  function review(applicationId: string, status: "accepted" | "rejected") {
    startTransition(async () => {
      const result = await reviewProjectApplicationAction({ applicationId, status, slug: project.slug });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setApplications((items) => items.map((item) => item.id === applicationId ? { ...item, status } : item));
      toast.success(status === "accepted" ? "Applicant added to the team" : "Application rejected");
      router.refresh();
    });
  }

  const actionLabel = project.isCreator ? "Project owner" : project.isMember || applicationStatus === "accepted" ? "Team member" : applicationStatus === "pending" ? "Application pending" : "Apply to join";

  return (
    <div className="page-container">
      <header className="border-b pb-8">
        <div className="flex items-center gap-2"><Badge className="capitalize">{project.status}</Badge><span className="text-xs text-muted-foreground">{project.category}</span></div>
        <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div><h1 className="text-balance text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">{project.name}</h1><p className="mt-3 max-w-2xl text-lg text-muted-foreground">{project.tagline}</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={toggleSave} disabled={pending} aria-pressed={saved}><Bookmark className={cn("size-4", saved && "fill-current text-primary")} />{saved ? "Saved" : "Save"}</Button><Button variant="outline" size="icon" onClick={() => share(project.name, `/projects/${project.slug}`)} aria-label="Share project"><Share2 className="size-4" /></Button><Button onClick={() => setDialogOpen(true)} disabled={!canApply || pending}>{actionLabel}</Button></div></div>
      </header>
      <div className="grid gap-10 py-8 xl:grid-cols-[1fr_300px]">
        <div><p className="eyebrow">About the project</p><p className="mt-4 max-w-3xl whitespace-pre-wrap text-base leading-7">{project.description}</p>
          <section className="mt-10"><p className="eyebrow">Open roles</p><div className="mt-4 divide-y rounded-lg border">{openRoles.length ? openRoles.map((role) => <button key={role.id} type="button" onClick={() => canApply && setDialogOpen(true)} disabled={!canApply} className="flex w-full items-center justify-between p-4 text-start disabled:cursor-default"><span className="text-sm font-semibold">{role.title}</span><span className="text-xs text-muted-foreground">{canApply ? "Apply →" : "Open"}</span></button>) : <p className="p-5 text-sm text-muted-foreground">The team has no open roles right now.</p>}</div></section>
          {project.isCreator && <section className="mt-10"><div className="flex items-end justify-between"><div><p className="eyebrow">Owner tools</p><h2 className="mt-1 text-xl font-semibold">Applications</h2></div><span className="text-xs text-muted-foreground">{applications.filter((item) => item.status === "pending").length} pending</span></div><div className="surface mt-4 divide-y rounded-lg">{applications.length ? applications.map((application) => <article key={application.id} className="p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start"><Link href={`/u/${application.applicant.username}`} className="flex min-w-0 flex-1 gap-3"><AvatarMark initials={initials(application.applicant)} color="#4f5fc4" className="size-9" /><div><p className="text-sm font-semibold">{application.applicant.fullName}</p><p className="text-xs text-muted-foreground">{application.roleTitle}</p></div></Link><Badge variant="outline" className="w-fit capitalize">{application.status}</Badge></div><p className="mt-4 text-sm leading-6 text-muted-foreground">{application.message}</p>{application.status === "pending" && <div className="mt-4 flex gap-2"><Button size="sm" onClick={() => review(application.id, "accepted")} disabled={pending}>Accept</Button><Button size="sm" variant="outline" onClick={() => review(application.id, "rejected")} disabled={pending}>Reject</Button></div>}</article>) : <p className="p-8 text-center text-sm text-muted-foreground">No applications yet.</p>}</div></section>}
        </div>
        <aside className="space-y-6"><section className="surface rounded-lg p-5"><p className="eyebrow">Team</p><div className="mt-5 space-y-3">{project.members.map((member) => <Link key={member.profile.id} href={`/u/${member.profile.username}`} className="flex items-center gap-3"><AvatarMark initials={initials(member.profile)} color="#4f5fc4" className="size-9" /><div className="min-w-0"><p className="truncate text-xs font-semibold">{member.profile.fullName}</p><p className="text-[11px] text-muted-foreground">{member.roleTitle}</p></div></Link>)}</div><p className="mt-4 border-t pt-4 text-xs text-muted-foreground">{project.memberCount} {project.memberCount === 1 ? "contributor" : "contributors"}</p></section><div className="flex flex-wrap gap-2">{project.technologies.length ? project.technologies.map((item) => <Badge key={item} variant="secondary">{item}</Badge>) : <span className="text-xs text-muted-foreground">No technologies listed.</span>}</div><Button variant="outline" className="w-full" onClick={() => toast.info("Repository links are planned for a later phase.")}><Code2 className="size-4" />Repository not connected</Button></aside>
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent><DialogHeader><DialogTitle>Apply to {project.name}</DialogTitle><DialogDescription>Choose an open role and tell the team how you can contribute.</DialogDescription></DialogHeader><form onSubmit={apply} className="grid gap-4"><label className="grid gap-2 text-sm font-medium">Role<select name="role" required className="h-10 rounded-md border bg-background px-3"><option value="">Choose a role</option>{openRoles.map((role) => <option key={role.id} value={role.id}>{role.title}</option>)}</select></label><label className="grid gap-2 text-sm font-medium">Message<Textarea name="message" minLength={5} maxLength={1000} required placeholder="I can help because…" /></label><DialogFooter><Button type="submit" disabled={pending}>{pending ? "Sending…" : "Send application"}</Button></DialogFooter></form></DialogContent></Dialog>
    </div>
  );
}

export function LiveEventDetail({ event }: { event: LiveEvent }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [attending, setAttending] = useState(event.isAttending);
  const [saved, setSaved] = useState(event.isSaved);
  const [attendeeCount, setAttendeeCount] = useState(event.attendeeCount);
  const starts = new Date(event.startsAt);
  const ends = new Date(event.endsAt);
  const full = attendeeCount >= event.capacity;

  function toggleAttendance() {
    const next = !attending;
    setAttending(next);
    setAttendeeCount((count) => Math.max(0, count + (next ? 1 : -1)));
    startTransition(async () => {
      const result = await setEventAttendanceAction({ eventId: event.id, slug: event.slug, shouldAttend: next });
      if (!result.ok) {
        setAttending(!next);
        setAttendeeCount((count) => Math.max(0, count + (next ? -1 : 1)));
        toast.error(result.error);
        return;
      }
      toast.success(next ? "You are attending" : "Attendance cancelled");
      router.refresh();
    });
  }

  function toggleSave() {
    const next = !saved;
    setSaved(next);
    startTransition(async () => {
      const result = await setEventSavedAction({ eventId: event.id, slug: event.slug, shouldSave: next });
      if (!result.ok) {
        setSaved(!next);
        toast.error(result.error);
        return;
      }
      toast.success(next ? "Event saved" : "Removed from saved events");
      router.refresh();
    });
  }

  const date = starts.toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const time = `${starts.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}–${ends.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}`;
  return (
    <div className="page-container"><div className="grid gap-10 xl:grid-cols-[1fr_320px]"><div><header className="border-b pb-8"><Badge variant="secondary">{event.category}</Badge><h1 className="mt-5 text-balance text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">{event.title}</h1><p className="mt-4 max-w-2xl whitespace-pre-wrap text-lg leading-8 text-muted-foreground">{event.description}</p><p className="mt-6 text-sm">Organized by <Link href={`/u/${event.organizer.username}`} className="font-semibold hover:text-primary">{event.organizer.fullName}</Link></p></header><section className="py-8"><p className="eyebrow">Who’s going</p>{event.attendees.length ? <div className="mt-5 grid gap-3 sm:grid-cols-2">{event.attendees.map((profile) => <Link key={profile.id} href={`/u/${profile.username}`} className="surface flex items-center gap-3 rounded-lg p-4"><AvatarMark initials={initials(profile)} color="#4f5fc4" className="size-9" /><span className="truncate text-sm font-medium">{profile.fullName}</span></Link>)}</div> : <div className="mt-5 rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Be the first person to attend.</div>}</section></div>
      <aside><div className="surface rounded-lg p-5"><div className="space-y-5"><Info icon={CalendarDays} label="Date" value={date} /><Info icon={Clock} label="Time" value={time} /><Info icon={MapPin} label="Location" value={event.location} /><Info icon={Users} label="Capacity" value={`${attendeeCount} / ${event.capacity} attending`} /></div><div className="mt-6 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-[width]" style={{ width: `${Math.min(100, Math.round(attendeeCount / event.capacity * 100))}%` }} /></div><Button className="mt-6 w-full" variant={attending ? "outline" : "default"} onClick={toggleAttendance} disabled={pending || (full && !attending)}>{pending ? "Saving…" : attending ? "Leave event" : full ? "Event full" : "Attend event"}</Button><div className="mt-2 grid grid-cols-2 gap-2"><Button variant="outline" onClick={toggleSave} disabled={pending} aria-pressed={saved}><Bookmark className={cn("size-4", saved && "fill-current text-primary")} />{saved ? "Saved" : "Save"}</Button><Button variant="outline" onClick={() => share(event.title, `/events/${event.slug}`)}><Share2 className="size-4" />Share</Button></div>{event.isOrganizer && <p className="mt-4 text-center text-xs text-muted-foreground">You organize this event.</p>}</div></aside>
    </div></div>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return <div className="flex gap-3"><span className="grid size-9 place-items-center rounded-md bg-muted"><Icon className="size-4" /></span><div><p className="text-[10px] uppercase text-muted-foreground">{label}</p><p className="mt-1 text-sm font-medium">{value}</p></div></div>;
}
