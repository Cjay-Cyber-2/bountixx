"use client";

import { useEffect } from "react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

const HEARTBEAT_MS = 5_000;

/** Keeps the signed-in user visible in "Who's online" while the app is open. */
export function usePresenceHeartbeat() {
  useEffect(() => {
    let cancelled = false;

    const ping = async () => {
      try {
        await fetchWithAuth("/api/presence", { method: "POST" });
      } catch {
        // ignore transient network errors
      }
    };

    void ping();
    const id = window.setInterval(() => {
      if (!cancelled) void ping();
    }, HEARTBEAT_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible" && !cancelled) void ping();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
}
