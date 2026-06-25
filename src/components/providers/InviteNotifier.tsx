"use client";

import { useInviteNotifications } from "@/hooks/useInviteNotifications";

/** Global fast invite polling + toast when a new invite arrives. */
export function InviteNotifier() {
  useInviteNotifications({ notify: true });
  return null;
}
