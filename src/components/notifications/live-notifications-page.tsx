"use client";

import { CalendarDays, FolderKanban, Heart, MessageCircle, UserPlus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/actions/activity";
import { useLiveActivity } from "@/components/activity/live-activity-provider";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { listNotifications, type LiveNotification } from "@/lib/data/notifications";
import { createClient } from "@/lib/supabase/client";

const icons = {
  new_follower: UserPlus,
  post_comment: MessageCircle,
  post_like: Heart,
  project_application: FolderKanban,
  project_application_accepted: Users,
  project_application_rejected: CalendarDays,
};

function notificationTime(value: string) {
  const date = new Date(value);
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en", { month: "short", day: "numeric", year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric" });
}

export function LiveNotificationsPage({ initialNotifications }: { initialNotifications: LiveNotification[] }) {
  const router = useRouter();
  const { notificationRevision, refreshCounts } = useLiveActivity();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [pending, startTransition] = useTransition();
  const lastRevision = useRef(notificationRevision);
  const unread = notifications.filter((item) => !item.readAt).length;

  useEffect(() => {
    if (lastRevision.current === notificationRevision) return;
    lastRevision.current = notificationRevision;
    void listNotifications(createClient()).then(setNotifications).catch(() => {
      toast.error("Could not refresh notifications.");
    });
  }, [notificationRevision]);

  function openNotification(notification: LiveNotification) {
    const markedAt = new Date().toISOString();
    if (!notification.readAt) {
      setNotifications((items) => items.map((item) =>
        item.id === notification.id ? { ...item, readAt: markedAt } : item,
      ));
    }
    router.push(notification.href);
    startTransition(async () => {
      if (!notification.readAt) {
        const result = await markNotificationReadAction({ notificationId: notification.id });
        if (!result.ok) toast.error(result.error);
        await refreshCounts();
      }
    });
  }

  function markAll() {
    const markedAt = new Date().toISOString();
    const previous = notifications;
    setNotifications((items) => items.map((item) => ({ ...item, readAt: item.readAt ?? markedAt })));
    startTransition(async () => {
      const result = await markAllNotificationsReadAction();
      if (!result.ok) {
        setNotifications(previous);
        toast.error(result.error);
        return;
      }
      await refreshCounts();
    });
  }

  return (
    <div className="page-container max-w-4xl">
      <PageHeading
        eyebrow="Activity"
        title="Notifications"
        description={`${unread} unread update${unread === 1 ? "" : "s"} that may need your attention.`}
        action={<Button variant="outline" onClick={markAll} disabled={!unread || pending}>Mark all as read</Button>}
      />
      <div className="surface overflow-hidden rounded-lg">
        {notifications.map((notification) => {
          const Icon = icons[notification.type];
          const isUnread = !notification.readAt;
          return (
            <button
              key={notification.id}
              type="button"
              onClick={() => openNotification(notification)}
              className="flex w-full gap-4 border-b p-5 text-start transition-colors last:border-0 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`${isUnread ? "Unread: " : ""}${notification.text}`}
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                <Icon className="size-4" />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-medium">{notification.text}</span>
                <span className="mt-1 block text-xs text-muted-foreground">{notificationTime(notification.createdAt)}</span>
              </span>
              {isUnread && <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />}
            </button>
          );
        })}
        {!notifications.length && (
          <div className="p-16 text-center">
            <p className="font-semibold">You&apos;re all caught up.</p>
            <p className="mt-2 text-sm text-muted-foreground">New activity will arrive here in real time.</p>
          </div>
        )}
      </div>
    </div>
  );
}
