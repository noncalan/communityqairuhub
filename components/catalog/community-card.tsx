import Link from "next/link";
import { ArrowUpRight, Users } from "lucide-react";
import type { Community } from "@/types";
import { Badge } from "@/components/ui/badge";

export function CommunityCard({community}:{community:Community}){return <Link href={`/communities/${community.slug}`} className="group surface block overflow-hidden rounded-lg transition-transform hover:-translate-y-0.5"><div className="h-1.5" style={{backgroundColor:community.accent}}/><div className="p-5"><div className="flex items-start justify-between"><span className="eyebrow">{community.category}</span><ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"/></div><div className="mt-4 flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold tracking-[-0.03em]">{community.name}</h2>{community.status&&<Badge variant="secondary">{community.status}</Badge>}</div><p className="mt-1.5 min-h-10 text-sm leading-5 text-muted-foreground">{community.description}</p><p className="mt-5 flex items-center gap-1.5 text-xs text-muted-foreground"><Users className="size-3.5"/>{community.members} members</p></div></Link>}
