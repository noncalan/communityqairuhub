"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, BookOpen, Building2, CalendarDays, Compass, FolderKanban, Home, MessageSquare, Settings, Sparkles, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { demoNotifications, useDemoState } from "@/lib/demo/demo-store";
import { isLiveMode } from "@/lib/app-mode";
import { useLiveActivityOptional } from "@/components/activity/live-activity-provider";

export const navItems = [
  { href:"/home", label:"Home", icon:Home }, { href:"/people", label:"People", icon:Users },
  { href:"/communities", label:"Communities", icon:Sparkles }, { href:"/projects", label:"Projects", icon:FolderKanban },
  { href:"/clubs", label:"Clubs Prototype", icon:Building2 },
  { href:"/events", label:"Events", icon:CalendarDays }, { href:"/opportunities", label:"Opportunities", icon:Compass },
  { href:"/resources", label:"Resources", icon:BookOpen },
];
export const utilityItems = [
  { href:"/messages", label:"Messages", icon:MessageSquare, count:3 }, { href:"/notifications", label:"Notifications", icon:Bell, count:5 },
  { href:"/settings", label:"Settings", icon:Settings },
];

export function NavItems({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const { state } = useDemoState();
  const activity = useLiveActivityOptional();
  const render = (item: (typeof navItems)[number] & { count?: number }) => {
    const active = pathname === item.href || (item.href !== "/home" && pathname.startsWith(item.href));
    const count = isLiveMode
      ? item.href === "/notifications"
        ? activity?.notificationUnreadCount
        : item.href === "/messages"
          ? activity?.messageUnreadCount
          : undefined
      : item.href==="/notifications" ? demoNotifications.filter(x=>!state.readNotificationIds.includes(x.id)).length : item.href==="/messages" ? state.conversations.reduce((sum,x)=>sum+x.unread,0) : undefined;
    return <Link key={item.href} href={item.href} onClick={onNavigate} className={cn("group flex h-9 items-center gap-3 rounded-md px-2.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground", mobile && "h-11 text-sm")}>
      <item.icon className="size-[17px] shrink-0" /><span>{item.label}</span>{count ? <span className="ms-auto grid size-5 place-items-center rounded-full bg-primary text-[10px] text-primary-foreground">{count}</span> : null}
    </Link>;
  };
  return <><nav className="space-y-1">{navItems.map(render)}</nav><div className="my-4 h-px bg-border"/><nav className="space-y-1">{utilityItems.map(render)}</nav></>;
}
