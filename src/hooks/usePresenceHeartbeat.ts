"use client";

import { useEffect } from "react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useAuth } from "@/components/providers/AuthProvider";

const HEARTBEAT_MS = 5_000;

/** Keeps the signed-in user visible in "Who's online" while the app is open. */
export function usePresenceHeartbeat() {
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading || !user) return;

    let cancelled = false;

    const ping = async () => {
      try {
        await fetchWithAuth("/api/presence", { method: "POST" });
      } catch {
        // ignore transient network errors
      }
    };

    const start = window.setTimeout(() => {
      if (!cancelled) void ping();
    }, 400);

    const id = window.setInterval(() => {
      if (!cancelled) void ping();
    }, HEARTBEAT_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible" && !cancelled) void ping();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearTimeout(start);
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [authLoading, user]);
}
