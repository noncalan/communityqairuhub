"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getActivityCounts } from "@/lib/data/notifications";

type LiveActivityValue = {
  messageUnreadCount: number;
  notificationUnreadCount: number;
  messageRevision: number;
  notificationRevision: number;
  refreshCounts: () => Promise<void>;
};

const LiveActivityContext = createContext<LiveActivityValue | null>(null);

export function LiveActivityProvider({
  userId,
  initialMessageUnreadCount,
  initialNotificationUnreadCount,
  children,
}: {
  userId: string;
  initialMessageUnreadCount: number;
  initialNotificationUnreadCount: number;
  children: React.ReactNode;
}) {
  const [messageUnreadCount, setMessageUnreadCount] = useState(initialMessageUnreadCount);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(initialNotificationUnreadCount);
  const [messageRevision, setMessageRevision] = useState(0);
  const [notificationRevision, setNotificationRevision] = useState(0);

  const refreshCounts = useCallback(async () => {
    try {
      const counts = await getActivityCounts(createClient());
      setMessageUnreadCount(counts.messages);
      setNotificationUnreadCount(counts.notifications);
    } catch {
      // Keep the last known counts during reconnects and session transitions.
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`private-activity:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `recipient_id=eq.${userId}`,
        },
        () => {
          setMessageRevision((value) => value + 1);
          void refreshCounts();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversation_members",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          setMessageRevision((value) => value + 1);
          void refreshCounts();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        () => {
          setNotificationRevision((value) => value + 1);
          void refreshCounts();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        () => {
          setNotificationRevision((value) => value + 1);
          void refreshCounts();
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") void refreshCounts();
      });

    const refreshAfterVisibility = () => {
      if (document.visibilityState === "visible") void refreshCounts();
    };
    document.addEventListener("visibilitychange", refreshAfterVisibility);
    window.addEventListener("online", refreshAfterVisibility);

    return () => {
      document.removeEventListener("visibilitychange", refreshAfterVisibility);
      window.removeEventListener("online", refreshAfterVisibility);
      void supabase.removeChannel(channel);
    };
  }, [refreshCounts, userId]);

  const value = useMemo(
    () => ({
      messageUnreadCount,
      notificationUnreadCount,
      messageRevision,
      notificationRevision,
      refreshCounts,
    }),
    [messageRevision, messageUnreadCount, notificationRevision, notificationUnreadCount, refreshCounts],
  );

  return <LiveActivityContext.Provider value={value}>{children}</LiveActivityContext.Provider>;
}

export function useLiveActivity() {
  const context = useContext(LiveActivityContext);
  if (!context) throw new Error("useLiveActivity must be used inside LiveActivityProvider");
  return context;
}

export function useLiveActivityOptional() {
  return useContext(LiveActivityContext);
}
