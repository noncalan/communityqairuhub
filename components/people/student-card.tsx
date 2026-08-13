"use client";

import { useRouter } from "next/navigation";
import { MessageCircle, UserPlus } from "lucide-react";
import { toast } from "sonner";
import type { Student } from "@/types";
import { AvatarMark } from "@/components/shared/avatar-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDemoState } from "@/lib/demo/demo-store";

export function StudentCard({ student }: { student: Student }) {
  const router=useRouter();const {state,toggleIn,openConversation}=useDemoState();const followed=state.followedUsernames.includes(student.username);
  const open=()=>router.push(`/u/${student.username}`);const stop=(event:React.MouseEvent)=>event.stopPropagation();
  return <article role="link" tabIndex={0} onClick={open} onKeyDown={e=>{if(e.key==="Enter")open()}} className="group cursor-pointer border-b py-5 first:pt-0 last:border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
    <div className="flex gap-4"><AvatarMark initials={student.initials} color={student.color} className="size-11"/><div className="min-w-0 flex-1">
      <div><h2 className="font-semibold tracking-[-0.02em] group-hover:text-primary">{student.name}</h2><p className="text-xs text-muted-foreground">@{student.username} · {student.program}, Year {student.year}</p></div>
      <p className="mt-2 text-sm leading-5 text-muted-foreground">{student.bio}</p><div className="mt-3 flex flex-wrap items-center gap-1.5">{student.skills.map(x=><Badge key={x} variant="secondary" className="font-normal">{x}</Badge>)}{student.available&&<Badge variant="outline">Open to projects</Badge>}</div>
      <div className="mt-4 flex flex-wrap gap-2" onClick={stop}><Button size="sm" variant={followed?"outline":"default"} onClick={()=>{toggleIn("followedUsernames",student.username);toast.success(followed?"Unfollowed":"Now following")}}><UserPlus className="size-3.5"/>{followed?"Following":"Follow"}</Button><Button size="sm" variant="outline" onClick={()=>{openConversation(student.username);router.push(`/messages?user=${student.username}`)}}><MessageCircle className="size-3.5"/>Message</Button><Button size="sm" variant="ghost" onClick={()=>toast.success(`Invite sent to ${student.name}`)}>Invite</Button></div>
    </div></div>
  </article>;
}
