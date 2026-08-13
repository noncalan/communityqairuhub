"use client";

import Link from "next/link";
import { CalendarDays, FolderKanban, Heart, MessageCircle, UserPlus, Users } from "lucide-react";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { demoNotifications, useDemoState } from "@/lib/demo/demo-store";

const icons={project:FolderKanban,comment:MessageCircle,follow:UserPlus,event:CalendarDays,like:Heart,community:Users};

export function NotificationsPage(){
  const {state,markNotification,markAllNotifications}=useDemoState();const unread=demoNotifications.filter(item=>!state.readNotificationIds.includes(item.id)).length;
  return <div className="page-container max-w-4xl"><PageHeading eyebrow="Activity" title="Notifications" description={`${unread} unread update${unread===1?"":"s"} that may need your attention.`} action={<Button variant="outline" onClick={markAllNotifications} disabled={!unread}>Mark all as read</Button>}/><div className="surface overflow-hidden rounded-lg">{demoNotifications.map(notification=>{const Icon=icons[notification.kind];const isUnread=!state.readNotificationIds.includes(notification.id);return <Link key={notification.id} href={notification.href} onClick={()=>markNotification(notification.id)} className="flex gap-4 border-b p-5 text-start transition-colors last:border-0 hover:bg-accent focus-visible:ring-2"><span className="grid size-10 shrink-0 place-items-center rounded-md bg-primary/10 text-primary"><Icon className="size-4"/></span><div className="flex-1"><p className="text-sm font-medium">{notification.text}</p><p className="mt-1 text-xs text-muted-foreground">{notification.meta}</p></div>{isUnread&&<span className="mt-2 size-2 rounded-full bg-primary"/>}</Link>})}</div></div>;
}
