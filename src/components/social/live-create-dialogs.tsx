"use client";

import { useState, useTransition } from "react";
import { CalendarPlus, FolderPlus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createCommunityAction,
  createEventAction,
  createProjectAction,
} from "@/app/actions/social";
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
import { Textarea } from "@/components/ui/textarea";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1.5 text-sm font-medium">{label}{children}</label>;
}

const list = (value: FormDataEntryValue | null) =>
  String(value ?? "").split(",").map((item) => item.trim()).filter(Boolean);

export function LiveCommunityDialog() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    startTransition(async () => {
      const result = await createCommunityAction({
        name: String(data.get("name") ?? ""),
        category: String(data.get("category") ?? ""),
        description: String(data.get("description") ?? ""),
        status: data.get("status") === "active" ? "active" : "forming",
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Community created");
      form.reset();
      setOpen(false);
      router.push(`/communities/${result.data.slug}`);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="size-4" />Start a community</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start a community</DialogTitle>
          <DialogDescription>Create a real student-led space. You will become its owner.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <Field label="Name"><Input name="name" minLength={3} maxLength={80} required autoFocus /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category"><Input name="category" minLength={2} maxLength={60} required placeholder="Technology, Culture…" /></Field>
            <Field label="Status"><select name="status" defaultValue="forming" className="h-10 rounded-md border bg-background px-3 text-sm"><option value="forming">Forming</option><option value="active">Active</option></select></Field>
          </div>
          <Field label="Description"><Textarea name="description" minLength={8} maxLength={600} required className="min-h-28" /></Field>
          <DialogFooter><Button type="submit" disabled={pending}>{pending ? "Creating…" : "Create community"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function LiveProjectDialog({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    startTransition(async () => {
      const status = String(data.get("status"));
      const result = await createProjectAction({
        name: String(data.get("name") ?? ""),
        tagline: String(data.get("tagline") ?? ""),
        description: String(data.get("description") ?? ""),
        category: String(data.get("category") ?? ""),
        status: status === "building" || status === "launched" || status === "completed" ? status : "idea",
        technologies: list(data.get("technologies")),
        rolesNeeded: list(data.get("roles")),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Project published");
      form.reset();
      setOpen(false);
      router.push(`/projects/${result.data.slug}`);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size={compact ? "sm" : "default"}><FolderPlus className="size-4" />{compact ? "New project" : "Publish project"}</Button></DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Publish a project</DialogTitle>
          <DialogDescription>Create the project, its technology list and open roles in one transaction.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <Field label="Project name"><Input name="name" minLength={3} maxLength={100} required autoFocus /></Field>
          <Field label="One-line promise"><Input name="tagline" minLength={5} maxLength={160} required placeholder="What changes if this works?" /></Field>
          <Field label="Description"><Textarea name="description" minLength={10} maxLength={3000} required className="min-h-28" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category"><Input name="category" minLength={2} maxLength={60} required placeholder="Campus, EdTech…" /></Field>
            <Field label="Status"><select name="status" defaultValue="idea" className="h-10 rounded-md border bg-background px-3 text-sm"><option value="idea">Idea</option><option value="building">Building</option><option value="launched">Launched</option><option value="completed">Completed</option></select></Field>
          </div>
          <Field label="Technologies (comma-separated)"><Input name="technologies" placeholder="Next.js, Python" /></Field>
          <Field label="Open roles (comma-separated)"><Input name="roles" required placeholder="Designer, researcher" /></Field>
          <DialogFooter><Button type="submit" disabled={pending}>{pending ? "Publishing…" : "Publish project"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function LiveEventDialog({ dark = false }: { dark?: boolean }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    startTransition(async () => {
      const result = await createEventAction({
        title: String(data.get("title") ?? ""),
        description: String(data.get("description") ?? ""),
        category: String(data.get("category") ?? ""),
        startsAt: String(data.get("startsAt") ?? ""),
        endsAt: String(data.get("endsAt") ?? ""),
        location: String(data.get("location") ?? ""),
        capacity: Number(data.get("capacity")),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Event created");
      form.reset();
      setOpen(false);
      router.push(`/events/${result.data.slug}`);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant={dark ? "secondary" : "default"}><CalendarPlus className="size-4" />Create event</Button></DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create an event</DialogTitle>
          <DialogDescription>Publish a time, place and capacity for the QAIRU community.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <Field label="Title"><Input name="title" minLength={3} maxLength={120} required autoFocus /></Field>
          <Field label="Description"><Textarea name="description" minLength={8} maxLength={2000} required /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Starts"><Input name="startsAt" type="datetime-local" required /></Field>
            <Field label="Ends"><Input name="endsAt" type="datetime-local" required /></Field>
            <Field label="Location"><Input name="location" minLength={2} maxLength={160} required /></Field>
            <Field label="Capacity"><Input name="capacity" type="number" min={1} max={10000} defaultValue={30} required /></Field>
          </div>
          <Field label="Category"><Input name="category" minLength={2} maxLength={60} required placeholder="Workshop" /></Field>
          <DialogFooter><Button type="submit" disabled={pending}>{pending ? "Creating…" : "Create event"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
