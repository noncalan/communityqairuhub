"use client";

import Link from "next/link";
import { ArrowUpRight, BookOpen, Bookmark, FileText, Link2, Plus } from "lucide-react";
import { useDeferredValue, useRef, useState } from "react";
import { toast } from "sonner";
import { createResourceAction, setResourceSavedAction } from "@/app/actions/content";
import { PageHeading } from "@/components/shared/page-heading";
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
import { Textarea } from "@/components/ui/textarea";
import type { LiveResource, ResourceType } from "@/lib/data/resources";
import { cn } from "@/lib/utils";

const resourceTypes: Array<{ value: ResourceType; label: string }> = [
  { value: "guide", label: "Guide" },
  { value: "notes", label: "Notes" },
  { value: "repository", label: "Repository" },
  { value: "link", label: "Useful link" },
  { value: "document", label: "Document" },
];

const typeIcons: Record<ResourceType, typeof FileText> = {
  guide: BookOpen,
  notes: FileText,
  repository: Link2,
  link: Link2,
  document: FileText,
};

export function LiveResourcesPage({ initialResources }: { initialResources: LiveResource[] }) {
  const [resources, setResources] = useState(initialResources);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const categories = [...new Set(resources.map((resource) => resource.category))].sort();
  const filtered = resources.filter((resource) => {
    const matchesQuery = !deferredQuery || `${resource.title} ${resource.description} ${resource.author.fullName} ${resource.tags.join(" ")}`.toLowerCase().includes(deferredQuery);
    return matchesQuery && (category === "All" || resource.category === category);
  });

  return (
    <div className="page-container">
      <PageHeading eyebrow="Shared knowledge" title="Resources" description="Real notes, guides, repositories and useful links contributed by QAIRU students." action={<LiveResourceDialog onCreated={(resource) => setResources((items) => [resource, ...items.filter((item) => item.id !== resource.id)])} />} />
      <div className="mb-7 flex flex-col gap-3 border-y py-4 sm:flex-row">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} className="flex-1" placeholder="Search topics, tags or authors" aria-label="Search resources" />
        <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm" aria-label="Resource category"><option>All</option>{categories.map((item) => <option key={item}>{item}</option>)}</select>
        <span className="self-center text-xs text-muted-foreground">{filtered.length} results</span>
      </div>
      {filtered.length ? (
        <div className="surface rounded-lg">
          {filtered.map((resource) => <ResourceRow key={resource.id} resource={resource} />)}
        </div>
      ) : (
        <div className="surface rounded-lg border-dashed p-12 text-center">
          <h2 className="font-semibold">{resources.length ? "No matching resources" : "No live resources yet"}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{resources.length ? "Try another search or category." : "Share the first trustworthy guide, notes, repository or external link."}</p>
          {!resources.length && <div className="mt-5"><LiveResourceDialog onCreated={(resource) => setResources((items) => [resource, ...items])} /></div>}
        </div>
      )}
    </div>
  );
}

function ResourceRow({ resource }: { resource: LiveResource }) {
  const Icon = typeIcons[resource.type];
  return (
    <article className="grid gap-4 border-b p-5 last:border-0 md:grid-cols-[minmax(0,1fr)_150px_130px] md:items-center">
      <Link href={`/resources/${resource.id}`} className="group flex min-w-0 gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary"><Icon className="size-4" /></span>
        <div className="min-w-0"><h2 className="text-sm font-semibold group-hover:text-primary">{resource.title}</h2><p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{resource.description}</p><p className="mt-2 text-[11px] text-muted-foreground">By {resource.author.fullName} · {resource.type}</p></div>
      </Link>
      <Badge variant="secondary" className="w-fit">{resource.category}</Badge>
      <ResourceSaveButton resourceId={resource.id} initialSaved={resource.isSaved} initialCount={resource.saveCount} />
    </article>
  );
}

export function ResourceSaveButton({
  resourceId,
  initialSaved,
  initialCount,
  showCount = true,
}: {
  resourceId: string;
  initialSaved: boolean;
  initialCount: number;
  showCount?: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);
  const lock = useRef(false);

  async function toggle() {
    if (lock.current) return;
    lock.current = true;
    const next = !saved;
    setSaved(next);
    setCount((value) => Math.max(0, value + (next ? 1 : -1)));
    setPending(true);
    const result = await setResourceSavedAction({ resourceId, shouldSave: next });
    setPending(false);
    lock.current = false;
    if (!result.ok) {
      setSaved(!next);
      setCount((value) => Math.max(0, value + (next ? -1 : 1)));
      toast.error(result.error);
      return;
    }
    toast.success(next ? "Resource saved" : "Removed from saved resources");
  }

  return <Button variant={saved ? "secondary" : "outline"} size="sm" onClick={toggle} disabled={pending} aria-pressed={saved}><Bookmark className={cn("size-4", saved && "fill-current")} />{saved ? "Saved" : showCount ? `${count} saves` : "Save"}</Button>;
}

export function LiveResourceDialog({ onCreated }: { onCreated?: (resource: LiveResource) => void }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setPending(true);
    const result = await createResourceAction({
      title: String(data.get("title") ?? ""),
      description: String(data.get("description") ?? ""),
      type: String(data.get("type") ?? "guide") as ResourceType,
      category: String(data.get("category") ?? ""),
      tags: String(data.get("tags") ?? "").split(","),
      externalUrl: String(data.get("externalUrl") ?? ""),
    });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    onCreated?.(result.data);
    form.reset();
    setOpen(false);
    toast.success("Resource shared");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="size-4" />Share resource</Button></DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Share a resource</DialogTitle><DialogDescription>Add a real source and enough context for students to judge whether it is useful.</DialogDescription></DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <label className="grid gap-1.5 text-sm font-medium">Title<Input name="title" required minLength={3} maxLength={160} autoFocus /></label>
          <label className="grid gap-1.5 text-sm font-medium">Description<Textarea name="description" required minLength={8} maxLength={4000} className="min-h-28" /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-medium">Category<Input name="category" required minLength={2} maxLength={80} placeholder="Programming, Research…" /></label>
            <label className="grid gap-1.5 text-sm font-medium">Type<select name="type" className="h-10 rounded-md border bg-background px-3 text-sm">{resourceTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></label>
          </div>
          <label className="grid gap-1.5 text-sm font-medium">Tags (optional)<Input name="tags" placeholder="Research, Template" /></label>
          <label className="grid gap-1.5 text-sm font-medium">Source URL<Input name="externalUrl" type="url" required placeholder="https://…" /></label>
          <label className="grid gap-1.5 text-sm font-medium text-muted-foreground">File upload<Input type="file" disabled /><span className="text-xs font-normal">File uploads are unavailable until the resource Storage policy is implemented. Use a real external URL in this phase.</span></label>
          <DialogFooter><Button type="submit" disabled={pending}>{pending ? "Sharing…" : "Share resource"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function LiveResourceDetail({ resource }: { resource: LiveResource }) {
  const Icon = typeIcons[resource.type];
  return (
    <div className="page-container max-w-5xl">
      <Link href="/resources" className="text-xs text-muted-foreground hover:text-foreground">← All resources</Link>
      <div className="mt-6 grid gap-10 xl:grid-cols-[minmax(0,1fr)_260px]">
        <main>
          <div className="flex items-center gap-2"><span className="grid size-9 place-items-center rounded-md bg-primary/10 text-primary"><Icon className="size-4" /></span><Badge variant="secondary" className="capitalize">{resource.type}</Badge><Badge variant="outline">{resource.category}</Badge></div>
          <h1 className="mt-6 text-balance text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">{resource.title}</h1>
          <p className="mt-6 whitespace-pre-wrap text-base leading-7 text-muted-foreground">{resource.description}</p>
          {!!resource.tags.length && <div className="mt-7 flex flex-wrap gap-2">{resource.tags.map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}</div>}
        </main>
        <aside className="space-y-4">
          <section className="surface rounded-lg p-5"><p className="eyebrow">Shared by</p><Link href={`/u/${resource.author.username}`} className="mt-3 block text-sm font-semibold hover:text-primary">{resource.author.fullName}</Link><p className="mt-1 text-xs text-muted-foreground">@{resource.author.username}</p></section>
          <ResourceSaveButton resourceId={resource.id} initialSaved={resource.isSaved} initialCount={resource.saveCount} showCount={false} />
          {resource.externalUrl && <Button asChild className="w-full"><a href={resource.externalUrl} target="_blank" rel="noreferrer">Open source<ArrowUpRight className="size-4" /></a></Button>}
        </aside>
      </div>
    </div>
  );
}
