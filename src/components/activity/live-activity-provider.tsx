"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getUnreadMessageCount } from "@/lib/data/messages";
import { getUnreadNotificationCount } from "@/lib/data/notifications";

type LiveActivityValue = {
  messageUnreadCount: number;
  notificationUnreadCount: number;
  messageRevision: number;
  notificationRevision: number;
  refreshCounts: () => Promise<void>;
};

const LiveActivityContext = createContext<LiveActivityValue | null>(null);

async function measureClientRoundTrip<T>(
  metric: string,
  operation: () => Promise<T>,
) {
  const startedAt = performance.now();
  try {
    return await operation();
  } finally {
    console.info(JSON.stringify({
      event: "client_timing",
      metric,
      duration_ms: Math.round((performance.now() - startedAt) * 10) / 10,
    }));
  }
}

export function LiveActivityProvider({
  userId,
  children,
}: {
  userId: string;
  children: React.ReactNode;
}) {
  const [messageUnreadCount, setMessageUnreadCount] = useState(0);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  const [messageRevision, setMessageRevision] = useState(0);
  const [notificationRevision, setNotificationRevision] = useState(0);

  const refreshCounts = useCallback(async () => {
    try {
      const client = createClient();
      const [messages, notifications] = await Promise.all([
        measureClientRoundTrip("activity-unread-messages", () =>
          getUnreadMessageCount(client),
        ),
        measureClientRoundTrip("activity-unread-notifications", () =>
          getUnreadNotificationCount(client),
        ),
      ]);
      setMessageUnreadCount(messages);
      setNotificationUnreadCount(notifications);
    } catch {
      // Keep the last known counts during reconnects and session transitions.
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let initialRefreshTimer: number | null = null;
    let initialRefreshIdleCallback: number | null = null;
    const scheduleInitialRefresh = () => {
      if (initialRefreshTimer !== null) return;
      initialRefreshTimer = window.setTimeout(() => {
        initialRefreshTimer = null;
        if ("requestIdleCallback" in window) {
          initialRefreshIdleCallback = window.requestIdleCallback(
            () => void refreshCounts(),
            { timeout: 3000 },
          );
          return;
        }
        void refreshCounts();
      }, 1000);
    };
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
        if (status === "SUBSCRIBED") scheduleInitialRefresh();
      });

    const refreshAfterVisibility = () => {
      if (document.visibilityState === "visible") void refreshCounts();
    };
    document.addEventListener("visibilitychange", refreshAfterVisibility);
    window.addEventListener("online", refreshAfterVisibility);

    return () => {
      if (initialRefreshTimer !== null) window.clearTimeout(initialRefreshTimer);
      if (initialRefreshIdleCallback !== null) {
        window.cancelIdleCallback(initialRefreshIdleCallback);
      }
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
