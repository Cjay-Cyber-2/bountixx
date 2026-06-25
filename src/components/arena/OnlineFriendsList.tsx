"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { requestInvitePoll } from "@/hooks/useInviteNotifications";
import { readApiError } from "@/lib/readApiError";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  InvitePlayerButton,
  LobbyInviteButton,
  OnlinePlayer,
  OnlinePlayerRow,
} from "@/components/arena/OnlinePlayerRow";

const POLL_MS = 2_500;
const SEARCH_DEBOUNCE_MS = 300;
const MAX_AUTH_RETRIES = 4;
const RETRY_DELAY_MS = 600;

type SearchUser = OnlinePlayer & { isOnline?: boolean };

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

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
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
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<OnlinePlayer[]>(initialUsers ?? []);
  const [loading, setLoading] = useState(initialUsers === undefined);
  const [error, setError] = useState<string | null>(null);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const usersRef = useRef(users);
  const failStreakRef = useRef(0);
  const searchTimerRef = useRef<number | null>(null);

  const targetRoomId = roomId ?? activeLobby?.id;
  const excludeKey = excludeUserIds.join(",");
  const showSearch = variant === "lobby" && Boolean(targetRoomId);

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
      failStreakRef.current = 0;
      onCountChange?.(filtered.length);
      setLoading(false);
    },
    [excludeKey, onCountChange],
  );

  const loadOnline = useCallback(async () => {
    if (authLoading || !user) return;

    for (let attempt = 0; attempt < MAX_AUTH_RETRIES; attempt += 1) {
      try {
        const res = await fetchWithAuth("/api/presence");
        if (res.status === 401 && attempt < MAX_AUTH_RETRIES - 1) {
          await sleep(RETRY_DELAY_MS * (attempt + 1));
          continue;
        }
        if (res.status === 401) {
          if (usersRef.current.length === 0) {
            setError("Still signing you in — hang tight for a moment.");
          }
          return;
        }
        if (!res.ok) {
          failStreakRef.current += 1;
          if (failStreakRef.current >= 3 && usersRef.current.length === 0) {
            setError(await readApiError(res));
          }
          return;
        }

        const data = (await res.json()) as { users?: OnlinePlayer[] };
        applyUsers(data.users ?? []);
        return;
      } catch {
        failStreakRef.current += 1;
        if (failStreakRef.current >= 3 && usersRef.current.length === 0) {
          setError("Network error loading online players.");
        }
        return;
      }
    }
  }, [applyUsers, authLoading, user]);

  useEffect(() => {
    if (authLoading || !user) return;

    void loadOnline();
    const id = window.setInterval(() => void loadOnline(), POLL_MS);

    const refreshNow = () => {
      if (document.visibilityState === "visible") void loadOnline();
    };
    document.addEventListener("visibilitychange", refreshNow);
    window.addEventListener("focus", refreshNow);

    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", refreshNow);
      window.removeEventListener("focus", refreshNow);
    };
  }, [authLoading, loadOnline, user]);

  const runSearch = useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (trimmed.length < 2) {
        setSearchResults([]);
        setSearchLoading(false);
        return;
      }

      setSearchLoading(true);
      try {
        const res = await fetchWithAuth(
          `/api/users/search?q=${encodeURIComponent(trimmed)}`,
        );
        if (!res.ok) {
          setSearchResults([]);
          return;
        }
        const data = (await res.json()) as { users?: SearchUser[] };
        const excluded = new Set(excludeKey ? excludeKey.split(",") : []);
        setSearchResults((data.users ?? []).filter((u) => !excluded.has(u.id)));
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    },
    [excludeKey],
  );

  useEffect(() => {
    if (!showSearch) return;

    if (searchTimerRef.current) {
      window.clearTimeout(searchTimerRef.current);
    }

    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    searchTimerRef.current = window.setTimeout(() => {
      void runSearch(searchQuery);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (searchTimerRef.current) {
        window.clearTimeout(searchTimerRef.current);
      }
    };
  }, [runSearch, searchQuery, showSearch]);

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
      requestInvitePoll();
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

  const InviteBtn = variant === "lobby" ? LobbyInviteButton : InvitePlayerButton;

  const onlineIds = new Set(users.map((u) => u.id));
  const searchOnlyResults = searchResults.filter((u) => !onlineIds.has(u.id));

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

  return (
    <div className="flex flex-col gap-4">
      {showSearch && (
        <div className="relative shrink-0">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-haze-3 pointer-events-none"
            aria-hidden
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by username to invite…"
            className="bx-input w-full pl-9 h-10 text-sm"
            aria-label="Search players by username"
          />
          {searchLoading && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-space-mono text-[9px] text-haze-3">
              …
            </span>
          )}
        </div>
      )}

      {showSearch && searchQuery.trim().length >= 2 && (
        <div>
          <p className="font-space-mono text-[9px] text-haze-3 tracking-widest uppercase mb-2">
            Search results
          </p>
          {searchOnlyResults.length === 0 && !searchLoading ? (
            <p className="font-space-mono text-[10px] text-haze-3 py-2">
              No players match &quot;{searchQuery.trim()}&quot;
            </p>
          ) : (
            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
              {searchOnlyResults.map((player) => (
                <OnlinePlayerRow
                  key={`search-${player.id}`}
                  player={player}
                  online={player.isOnline}
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
          )}
        </div>
      )}

      <div>
        <p className="font-space-mono text-[9px] text-haze-3 tracking-widest uppercase mb-2">
          {showSearch ? "Online now" : "Players"}
          {users.length > 0 ? ` · ${users.length}` : ""}
        </p>

        {error && users.length === 0 ? (
          <p className="font-space-mono text-[10px] text-danger text-center py-6 leading-relaxed">
            {error}
          </p>
        ) : users.length === 0 ? (
          <p className="font-space-mono text-[10px] text-haze-3 text-center py-6 leading-relaxed">
            {emptyMessage}
          </p>
        ) : (
          <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
            {users.map((player) => (
              <OnlinePlayerRow
                key={player.id}
                player={player}
                online
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
        )}
      </div>
    </div>
  );
}
