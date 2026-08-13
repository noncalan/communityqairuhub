"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MoreHorizontal, Paperclip, Search, Send } from "lucide-react";
import { toast } from "sonner";
import { AvatarMark } from "@/components/shared/avatar-mark";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { students } from "@/lib/data/mock";
import { useDemoState } from "@/lib/demo/demo-store";

export function MessagesPage(){
  const params=useSearchParams();const {state,sendMessage,openConversation}=useDemoState();
  const requested=params.get("user");const [active,setActive]=useState(requested||state.conversations[0]?.username||"daniyar");const selected=requested||active;const [query,setQuery]=useState("");const endRef=useRef<HTMLDivElement>(null);
  const conversations=useMemo(()=>state.conversations.filter(conversation=>{const student=students.find(item=>item.username===conversation.username);return `${student?.name} ${conversation.messages.at(-1)?.text}`.toLowerCase().includes(query.toLowerCase())}),[query,state.conversations]);
  const activeConversation=state.conversations.find(item=>item.username===selected);const student=students.find(item=>item.username===selected)??students[1];
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"})},[activeConversation?.messages.length]);
  function select(username:string){setActive(username);openConversation(username)}
  function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();const input=event.currentTarget.elements.namedItem("message") as HTMLInputElement;const text=input.value.trim();if(!text)return;sendMessage(selected,text);input.value="";}
  return <div className="page-container"><PageHeading eyebrow="Direct conversations" title="Messages" description="One-to-one messages with students across QAIRU."/><div className="surface grid min-h-[620px] overflow-hidden rounded-lg md:grid-cols-[280px_1fr]">
    <aside className="border-e"><div className="border-b p-3"><div className="relative"><Search className="absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"/><Input value={query} onChange={event=>setQuery(event.target.value)} className="h-9 ps-8" placeholder="Search conversations"/></div></div>{conversations.map(conversation=>{const person=students.find(item=>item.username===conversation.username);if(!person)return null;const last=conversation.messages.at(-1);return <button key={person.username} onClick={()=>select(person.username)} className={`flex w-full items-center gap-3 border-b p-3 text-start transition-colors hover:bg-accent focus-visible:ring-2 ${selected===person.username?"bg-accent":""}`}><AvatarMark initials={person.initials} color={person.color} className="size-9"/><div className="min-w-0 flex-1"><div className="flex justify-between"><p className="truncate text-xs font-semibold">{person.name}</p><span className="text-[9px] text-muted-foreground">{last?.createdAt}</span></div><p className="mt-1 truncate text-[11px] text-muted-foreground">{last?.text||"Start a conversation"}</p></div>{conversation.unread>0&&<span className="grid size-5 place-items-center rounded-full bg-primary text-[10px] text-primary-foreground">{conversation.unread}</span>}</button>})}</aside>
    <section className="flex min-h-[520px] flex-col"><header className="flex h-16 items-center gap-3 border-b px-5"><AvatarMark initials={student.initials} color={student.color} className="size-9"/><div><p className="text-sm font-semibold">{student.name}</p><p className="text-[11px] text-emerald-600">Available on campus</p></div><Button className="ms-auto" size="icon" variant="ghost" aria-label="Conversation options" onClick={()=>toast.info("No additional conversation actions in this demo.")}><MoreHorizontal className="size-4"/></Button></header><div className="flex flex-1 flex-col justify-end gap-4 overflow-y-auto p-5"><p className="self-center text-[10px] text-muted-foreground">Conversation</p>{activeConversation?.messages.map(message=><div key={message.id} className={`max-w-[75%] rounded-lg px-3.5 py-2.5 text-xs leading-5 ${message.sender==="me"?"ms-auto bg-primary text-primary-foreground":"bg-muted"}`}><p>{message.text}</p><p className="mt-1 text-[9px] opacity-60">{message.createdAt}</p></div>)}{!activeConversation?.messages.length&&<p className="self-center text-sm text-muted-foreground">Send the first message to {student.name}.</p>}<div ref={endRef}/></div><form onSubmit={submit} className="flex gap-2 border-t p-4"><Button type="button" size="icon" variant="ghost" aria-label="Attach a file" onClick={()=>toast.info("Attachments are disabled in the local demo. Connect Storage to enable them.")}><Paperclip className="size-4"/></Button><Input name="message" placeholder="Write a message…" autoComplete="off"/><Button size="icon" aria-label="Send message"><Send className="size-4"/></Button></form></section>
  </div></div>;
}
