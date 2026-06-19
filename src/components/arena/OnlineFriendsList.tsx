"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import {
  InvitePlayerButton,
  LobbyInviteButton,
  OnlinePlayer,
  OnlinePlayerRow,
} from "@/components/arena/OnlinePlayerRow";

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
  const [loading, setLoading] = useState(!initialUsers?.length);
  const [error, setError] = useState<string | null>(null);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());

  const targetRoomId = roomId ?? activeLobby?.id;
  const excluded = new Set(excludeUserIds);

  const loadOnline = useCallback(async () => {
    try {
      const res = await fetchWithAuth("/api/presence");
      if (res.status === 401) {
        setError("Sign in to see who is online.");
        setUsers([]);
        onCountChange?.(0);
        return;
      }
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "Could not load online players.");
        return;
      }
      const data = (await res.json()) as { users?: OnlinePlayer[]; count?: number };
      const filtered = (data.users ?? []).filter((u) => !excluded.has(u.id));
      setUsers(filtered);
      setError(null);
      onCountChange?.(filtered.length);
    } catch {
      setError("Network error loading online players.");
    } finally {
      setLoading(false);
    }
  }, [excludeUserIds.join(","), onCountChange]);

  useEffect(() => {
    void loadOnline();
    const id = window.setInterval(() => void loadOnline(), 5_000);
    return () => window.clearInterval(id);
  }, [loadOnline]);

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
