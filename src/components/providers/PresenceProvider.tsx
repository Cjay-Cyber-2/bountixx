"use client";

import { usePresenceHeartbeat } from "@/hooks/usePresenceHeartbeat";

/** Keeps signed-in users visible app-wide (arena, lobby, dashboard, etc.). */
export function PresenceProvider({ children }: { children: React.ReactNode }) {
  usePresenceHeartbeat();
  return <>{children}</>;
}
