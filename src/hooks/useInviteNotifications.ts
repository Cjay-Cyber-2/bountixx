"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/ui/Toast";

const INVITE_POLL_MS = 2_000;

export type PendingInvite = {
  id: string;
  roomId: string;
  roomName: string;
  inviterName: string;
  minutesLeft: number;
};

type InvitePollOptions = {
  onInvites?: (invites: PendingInvite[]) => void;
  notify?: boolean;
};

/** Fast invite polling so invitees see invites within ~2s without refreshing. */
export function useInviteNotifications(options: InvitePollOptions = {}) {
  const { onInvites, notify = false } = options;
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const pathname = usePathname();
  const seenIdsRef = useRef<Set<string>>(new Set());
  const primedRef = useRef(false);

  useEffect(() => {
    if (authLoading || !user) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetchWithAuth("/api/invites");
        if (!res.ok || cancelled) return;

        const data = (await res.json()) as {
          invites?: {
            id: string;
            roomId: string;
            roomName: string;
            inviterName?: string;
            minutesLeft: number;
          }[];
        };

        const invites: PendingInvite[] = (data.invites ?? []).map((inv) => ({
          id: inv.id,
          roomId: inv.roomId,
          roomName: inv.roomName,
          inviterName: inv.inviterName ?? "Someone",
          minutesLeft: inv.minutesLeft,
        }));

        onInvites?.(invites);

        if (notify) {
          const nextIds = new Set(invites.map((i) => i.id));
          if (!primedRef.current) {
            seenIdsRef.current = nextIds;
            primedRef.current = true;
          } else {
            for (const inv of invites) {
              if (!seenIdsRef.current.has(inv.id)) {
                toast({
                  type: "info",
                  title: "Arena invite",
                  message: `@${inv.inviterName} invited you to ${inv.roomName}`,
                  duration: 8000,
                });
              }
            }
            seenIdsRef.current = nextIds;
          }
        }
      } catch {
        // ignore transient errors
      }
    };

    void poll();
    const id = window.setInterval(() => void poll(), INVITE_POLL_MS);

    const refreshNow = () => {
      if (document.visibilityState === "visible" && !cancelled) void poll();
    };
    document.addEventListener("visibilitychange", refreshNow);
    window.addEventListener("focus", refreshNow);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", refreshNow);
      window.removeEventListener("focus", refreshNow);
    };
  }, [authLoading, notify, onInvites, pathname, toast, user]);
}
