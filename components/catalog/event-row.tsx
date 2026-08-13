import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import type { CampusEvent } from "@/types";

export function EventRow({ event }: { event: CampusEvent }) {
  return <article className="group grid grid-cols-[54px_1fr] gap-4 border-b py-5 first:pt-0 last:border-0 sm:grid-cols-[64px_1fr_auto] sm:items-center">
    <div className="rounded-md border bg-muted/40 py-2 text-center"><div className="text-[10px] font-semibold tracking-widest text-primary">{event.month}</div><div className="font-mono text-xl font-semibold">{event.day}</div></div>
    <div><div className="mb-1 flex items-center gap-2 text-[11px] text-muted-foreground"><span>{event.category}</span><span>·</span><span>{event.time}</span></div><Link href={`/events/${event.slug}`} className="font-semibold tracking-[-0.02em] hover:text-primary">{event.title}</Link><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3"/>{event.location} · {event.organizer}</p></div>
    <Link href={`/events/${event.slug}`} aria-label={`View ${event.title}`} className="col-start-2 flex size-9 items-center justify-center rounded-md border transition-colors group-hover:bg-foreground group-hover:text-background sm:col-auto"><ArrowRight className="size-4"/></Link>
  </article>;
}
