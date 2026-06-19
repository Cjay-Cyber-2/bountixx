"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import {
  InvitePlayerButton,
  LobbyInviteButton,
  OnlinePlayer,
  OnlinePlayerRow,
} from "@/components/arena/OnlinePlayerRow";

const POLL_MS = 1_000;
const STREAM_RECONNECT_MS = 2_000;

type OnlineFriendsListProps = {
  roomId?: string;
  activeLobby?: { id: string; name: string } | null;
  excludeUserIds?: string[];
  initialUsers?: OnlinePlayer[];
  variant?: "dashboard" | "lobby";
  emptyMessage?: string;
  onCountChange?: (count: number) => void;
  onNotify?: (message: string, type?: "info" | "success" | "error") => void;
};

function samePlayerList(a: OnlinePlayer[], b: OnlinePlayer[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((player, index) => player.id === b[index]?.id);
}

export function OnlineFriendsList({
  roomId,
  activeLobby,
  excludeUserIds = [],
  initialUsers,
  variant = "dashboard",
  emptyMessage = "No one else online right now. When players open the app they appear here automatically.",
  onCountChange,
  onNotify,
}: OnlineFriendsListProps) {
  const [users, setUsers] = useState<OnlinePlayer[]>(initialUsers ?? []);
  const [loading, setLoading] = useState(initialUsers === undefined);
  const [error, setError] = useState<string | null>(null);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());
  const usersRef = useRef(users);

  const targetRoomId = roomId ?? activeLobby?.id;
  const excludeKey = excludeUserIds.join(",");

  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  const applyUsers = useCallback(
    (list: OnlinePlayer[]) => {
      const excluded = new Set(excludeKey ? excludeKey.split(",") : []);
      const filtered = list.filter((u) => !excluded.has(u.id));
      if (samePlayerList(usersRef.current, filtered)) return;
      setUsers(filtered);
      setError(null);
      onCountChange?.(filtered.length);
      setLoading(false);
    },
    [excludeKey, onCountChange],
  );

  const loadOnline = useCallback(async () => {
    try {
      const res = await fetchWithAuth("/api/presence");
      if (res.status === 401) {
        setError("Finishing account setup — try again in a moment.");
        setUsers([]);
        onCountChange?.(0);
        return;
      }
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "Could not load online players.");
        return;
      }
      const data = (await res.json()) as { users?: OnlinePlayer[] };
      applyUsers(data.users ?? []);
    } catch {
      setError("Network error loading online players.");
    } finally {
      setLoading(false);
    }
  }, [applyUsers, onCountChange]);

  useEffect(() => {
    let disposed = false;
    let pollId: number | null = null;
    let reconnectId: number | null = null;
    let source: EventSource | null = null;

    const stopPolling = () => {
      if (pollId !== null) {
        window.clearInterval(pollId);
        pollId = null;
      }
    };

    const startPolling = () => {
      if (pollId !== null || disposed) return;
      void loadOnline();
      pollId = window.setInterval(() => void loadOnline(), POLL_MS);
    };

    const connectStream = () => {
      if (disposed) return;

      source?.close();
      source = new EventSource("/api/presence/stream");

      source.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as { users?: OnlinePlayer[] };
          applyUsers(data.users ?? []);
          stopPolling();
        } catch {
          // ignore malformed payloads
        }
      };

      source.onerror = () => {
        source?.close();
        source = null;
        if (disposed) return;
        startPolling();
        if (reconnectId === null) {
          reconnectId = window.setInterval(() => {
            if (!disposed && !source) connectStream();
          }, STREAM_RECONNECT_MS);
        }
      };
    };

    connectStream();

    const refreshNow = () => {
      if (disposed) return;
      void loadOnline();
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") refreshNow();
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", refreshNow);

    return () => {
      disposed = true;
      source?.close();
      stopPolling();
      if (reconnectId !== null) window.clearInterval(reconnectId);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", refreshNow);
    };
  }, [applyUsers, loadOnline]);

  const invite = async (player: OnlinePlayer) => {
    if (!targetRoomId) {
      onNotify?.("Create an arena first — then invite players from here or the lobby.", "info");
      return;
    }

    setInvitingId(player.id);
    try {
      const res = await fetchWithAuth(`/api/rooms/${targetRoomId}/invite`, {
        method: "POST",
        body: JSON.stringify({ inviteeIds: [player.id] }),
      });
      const json = (await res.json()) as { error?: string; invited?: number };
      if (!res.ok) {
        onNotify?.(json.error ?? "Could not send invite", "error");
        return;
      }
      setInvitedIds((prev) => new Set(prev).add(player.id));
      const roomName = activeLobby?.name ?? "your arena";
      onNotify?.(`Invite sent to @${player.username} for ${roomName}`, "success");
      if (variant === "dashboard") {
        window.setTimeout(() => {
          setInvitedIds((prev) => {
            const next = new Set(prev);
            next.delete(player.id);
            return next;
          });
        }, 2500);
      }
    } catch {
      onNotify?.("Network error sending invite", "error");
    } finally {
      setInvitingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-cosmos-3 animate-pulse shrink-0" />
            <div className="flex-1">
              <div className="h-3 w-24 bg-cosmos-3 animate-pulse mb-1.5" />
              <div className="h-2 w-16 bg-cosmos-3 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="font-space-mono text-[10px] text-danger text-center py-6 leading-relaxed">{error}</p>
    );
  }

  if (users.length === 0) {
    return (
      <p className="font-space-mono text-[10px] text-haze-3 text-center py-6 leading-relaxed">{emptyMessage}</p>
    );
  }

  const InviteBtn = variant === "lobby" ? LobbyInviteButton : InvitePlayerButton;

  return (
    <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
      {users.map((player) => (
        <OnlinePlayerRow
          key={player.id}
          player={player}
          action={
            <InviteBtn
              loading={invitingId === player.id}
              invited={invitedIds.has(player.id)}
              onClick={() => void invite(player)}
            />
          }
        />
      ))}
    </div>
  );
}
