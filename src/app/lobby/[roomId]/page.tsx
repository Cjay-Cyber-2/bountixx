"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Users, LogIn } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { AppLayout } from "@/components/layout/AppLayout";
import { APP_GUTTERS } from "@/components/landing/_section";
import { InviteSharePanel } from "@/components/arena/InviteSharePanel";
import { OnlineFriendsList } from "@/components/arena/OnlineFriendsList";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/components/providers/AuthProvider";
import { staggerContainer, slideUp } from "@/lib/animations";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

/* ─── Types ─── */
type RoomCategory = "coding" | "trivia" | "logic" | "math" | "writing" | "design" | "meme";
type RoomDifficulty = "rookie" | "challenger" | "elite" | "legendary";
type BountyTier = "bronze" | "silver" | "gold" | "mythic";
type PlayerStatus = "invited" | "joined" | "ready" | "completed" | "forfeited";

interface Player {
  id: string;
  userId: string;
  status: PlayerStatus;
  joinedAt: string | null;
  username: string | null;
  avatarUrl: string | null;
  rank: string | null;
}

interface Room {
  id: string;
  name: string;
  taskRaw: string;
  taskNormalised: string | null;
  category: RoomCategory | null;
  difficulty: RoomDifficulty | null;
  bountyTier: BountyTier;
  status: "lobby" | "live" | "ended" | "cancelled";
  adminId: string;
  playerCap: number;
  timerSeconds: number | null;
  startedAt: string | null;
}

interface RoomData {
  room: Room;
  players: Player[];
  isAdmin: boolean;
}

/* ─── Constants ─── */
const CAT_COLORS: Record<string, string> = {
  coding: "#FF6B1A",
  trivia: "#9B6BFF",
  logic: "#00D68F",
  math: "#F0A500",
  writing: "#9B8FC0",
  design: "#C084FC",
  meme: "#F472B6",
};

const DIFF_CHIP_COLOR: Record<RoomDifficulty, "ignite" | "crown" | "void" | "success" | "danger" | "haze"> = {
  rookie: "success",
  challenger: "crown",
  elite: "void",
  legendary: "danger",
};

function formatTimer(secs: number | null): string {
  if (!secs) return "No timer";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
}

/* ─── Player row ─── */
function PlayerRow({ player, isHost = false }: { player: Player; isHost?: boolean }) {
  const isReady = player.status === "ready";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      className="flex items-center gap-3 px-4 py-3 bg-cosmos-2 border border-cosmos-4"
      style={isHost ? { borderColor: "rgba(240,165,0,0.35)" } : undefined}
    >
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-cosmos-3 border border-cosmos-4 flex items-center justify-center shrink-0">
        <span className="font-orbitron font-bold text-[10px] text-haze">
          {(player.username ?? "?").slice(0, 2).toUpperCase()}
        </span>
      </div>

      {/* Name + rank */}
      <div className="flex-1 min-w-0">
        <p className="font-rajdhani font-bold text-sm text-haze truncate">
          @{player.username ?? "player"}
        </p>
        {player.rank && (
          <p className="font-space-mono text-[9px] text-haze-3 uppercase">{player.rank}</p>
        )}
      </div>

      {/* Status: HOST badge or ready indicator */}
      {isHost ? (
        <span className="font-space-mono text-[10px] text-crown tracking-widest">HOST</span>
      ) : (
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${isReady ? "bg-success dot-live" : "bg-haze-3"}`}
          />
          <span
            className={`font-space-mono text-[10px] ${
              isReady ? "text-success" : "text-haze-3"
            }`}
          >
            {isReady ? "READY" : "WAITING"}
          </span>
        </div>
      )}
    </motion.div>
  );
}

/* ─── Main ─── */
export default function LobbyPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;
  const { toast } = useToast();
  const { user } = useAuth();

  const [data, setData] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [myStatus, setMyStatus] = useState<"joined" | "ready">("joined");
  const [readying, setReadying] = useState(false);
  const [starting, setStarting] = useState(false);

  /* ─── Fetch ─── */
  const fetchRoom = useCallback(
    async (silent = false) => {
      try {
        const res = await fetchWithAuth(`/api/rooms/${roomId}`);
        if (res.status === 401) {
          router.replace(`/login?next=/lobby/${roomId}`);
          return;
        }
        if (!res.ok) return;

        const json = (await res.json()) as RoomData;

        if (json.room.status === "live") {
          router.replace(`/arena/${roomId}`);
          return;
        }
        if (json.room.status === "ended" || json.room.status === "cancelled") {
          router.replace(`/arena/${roomId}/results`);
          return;
        }

        setData(json);

        // Sync my ready status from server data
        // We don't know who "I am" from here, but we rely on polling to stay fresh
      } catch {
        // ignore
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [roomId, router]
  );

  useEffect(() => {
    fetchRoom(false);
  }, [fetchRoom]);

  /* ─── Poll every 2s ─── */
  useEffect(() => {
    const id = setInterval(() => fetchRoom(true), 2000);
    return () => clearInterval(id);
  }, [fetchRoom]);

  /* ─── Keep my ready state in sync with the server (survives refresh/poll) ─── */
  useEffect(() => {
    if (!data || !user) return;
    const me = data.players.find((p) => p.userId === user.uid);
    if (me) setMyStatus(me.status === "ready" ? "ready" : "joined");
  }, [data, user]);

  /* ─── Ready toggle ─── */
  async function handleReady() {
    setReadying(true);
    try {
      const res = await fetchWithAuth(`/api/rooms/${roomId}/ready`, {
        method: "PATCH",
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        toast({ type: "error", title: err.error ?? "Failed to update status" });
        return;
      }
      const json = (await res.json()) as {
        status: "joined" | "ready";
        allReady: boolean;
        playerCount: number;
      };
      setMyStatus(json.status);
      toast({
        type: json.status === "ready" ? "success" : "info",
        title: json.status === "ready" ? "You are READY!" : "Marked as waiting",
      });
    } catch {
      toast({ type: "error", title: "Network error" });
    } finally {
      setReadying(false);
    }
  }

  /* ─── Start arena (admin) ─── */
  async function handleStart() {
    if (!data) return;
    setStarting(true);
    try {
      const res = await fetchWithAuth(`/api/rooms/${roomId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "live" }),
      });
      const json = (await res.json()) as { room?: unknown; error?: string; removedPlayers?: string[] };
      if (!res.ok) {
        toast({ type: "error", title: json.error ?? "Failed to start arena" });
        return;
      }
      if (json.removedPlayers && json.removedPlayers.length > 0) {
        toast({
          type: "info",
          title: `${json.removedPlayers.length} player(s) removed — insufficient coins`,
        });
      }
      router.replace(`/arena/${roomId}`);
    } catch {
      toast({ type: "error", title: "Network error" });
    } finally {
      setStarting(false);
    }
  }

  /* ─── Loading ─── */
  if (loading) {
    return (
      <div className="min-h-screen bg-cosmos flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="spinner" />
          <p className="font-space-mono text-xs text-haze-3 tracking-widest">
            LOADING LOBBY...
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="font-rajdhani text-danger">Room not found.</p>
        </div>
      </AppLayout>
    );
  }

  const { room, players, isAdmin } = data;
  const catColor = CAT_COLORS[room.category ?? "coding"] ?? "#FF6B1A";
  // The host referees — they don't count as a player anywhere
  const host = players.find((p) => p.userId === room.adminId);
  const competitors = players.filter((p) => p.userId !== room.adminId);
  const readyCount = competitors.filter((p) => p.status === "ready").length;
  const allReady = competitors.length >= 2 && readyCount === competitors.length;
  const canStart = isAdmin && allReady;

  /* Challenge preview: truncate at 200 chars */
  const taskText = room.taskNormalised ?? room.taskRaw;
  const taskPreview =
    taskText.length > 200 ? taskText.slice(0, 200) + "..." : taskText;

  return (
    <AppLayout>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className={`${APP_GUTTERS} py-10`}
      >
        {/* Header */}
        <motion.div variants={slideUp} className="mb-8">
          <p className="font-space-mono text-[10px] text-void tracking-[6px] mb-2 uppercase">
            Arena Lobby
          </p>
          <h1 className="font-zen-dots text-2xl text-haze mb-2">{room.name}</h1>
          <div className="flex flex-wrap items-center gap-2">
            {room.category && (
              <span
                className="font-space-mono text-[10px] px-2 py-0.5 border"
                style={{
                  color: catColor,
                  borderColor: `${catColor}40`,
                  backgroundColor: `${catColor}15`,
                }}
              >
                {room.category.toUpperCase()}
              </span>
            )}
            {room.difficulty && (
              <Chip color={DIFF_CHIP_COLOR[room.difficulty]} size="xs">
                {room.difficulty.toUpperCase()}
              </Chip>
            )}
            <Chip color="crown" size="xs">{room.bountyTier.toUpperCase()}</Chip>
          </div>
        </motion.div>

        {/* Challenge preview */}
        <motion.div
          variants={slideUp}
          className="mb-6 bg-cosmos-2 border border-cosmos-4 p-5"
        >
          <p className="font-space-mono text-[10px] text-void tracking-widest mb-3 uppercase">
            Challenge Preview
          </p>
          <p className="font-rajdhani text-sm text-haze-2 leading-relaxed">{taskPreview}</p>
        </motion.div>

        {/* Room meta */}
        <motion.div variants={slideUp} className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: "Timer", value: formatTimer(room.timerSeconds) },
            { label: "Player Cap", value: `${room.playerCap} players` },
            { label: "Entry Fee", value: "50 coins" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-cosmos-2 border border-cosmos-4 p-3 text-center">
              <p className="font-space-mono text-[9px] text-haze-3 tracking-widest uppercase mb-1">{label}</p>
              <p className="font-orbitron font-bold text-sm text-haze">{value}</p>
            </div>
          ))}
        </motion.div>

        {/* Prize pool banner */}
        <motion.div variants={slideUp} className="flex items-center justify-between bg-coin-gold/5 border border-coin-gold/25 px-4 py-3 mb-6">
          <div>
            <p className="font-space-mono text-[9px] text-haze-3 tracking-widest uppercase">Current Prize Pool</p>
            <p className="font-orbitron font-black text-xl text-coin-gold mt-0.5">{competitors.length * 50} coins</p>
          </div>
          <div className="text-right">
            <p className="font-space-mono text-[9px] text-haze-3">Max: {room.playerCap * 50} coins</p>
            <p className="font-space-mono text-[9px] text-haze-3 mt-0.5">Winner takes all</p>
          </div>
        </motion.div>

        {/* Players list */}
        <motion.div variants={slideUp} className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="font-space-mono text-[10px] text-void tracking-widest uppercase">
              Players
            </p>
            <div className="flex items-center gap-1.5">
              <Users size={12} className="text-haze-3" />
              <span className="font-space-mono text-[10px] text-haze-3">
                {competitors.length} / {room.playerCap}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <AnimatePresence mode="popLayout">
              {host && <PlayerRow key={host.id} player={host} isHost />}
              {competitors.map((player) => (
                <PlayerRow key={player.id} player={player} />
              ))}
            </AnimatePresence>
            {competitors.length < room.playerCap && (
              <div className="flex items-center gap-3 px-4 py-3 bg-cosmos-2/50 border border-dashed border-cosmos-4">
                <div className="w-8 h-8 rounded-full bg-cosmos-3 border border-dashed border-cosmos-4 flex items-center justify-center shrink-0">
                  <span className="text-haze-3 text-xs">+</span>
                </div>
                <p className="font-space-mono text-[10px] text-haze-3">
                  Waiting for players... ({competitors.length}/{room.playerCap})
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div variants={slideUp} className="flex flex-col gap-3 mb-6">
          {!isAdmin && (
            <Button
              variant={myStatus === "ready" ? "secondary" : "primary"}
              size="md"
              fullWidth
              onClick={handleReady}
              loading={readying}
              disabled={readying}
            >
              {myStatus === "ready" ? "READY ✓" : "I'M READY"}
            </Button>
          )}

          {isAdmin && (
            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={handleStart}
              loading={starting}
              disabled={!canStart || starting}
            >
              <LogIn size={16} aria-hidden="true" />
              {canStart ? "START ARENA" : `Waiting for all players to be ready (${readyCount}/${competitors.length})`}
            </Button>
          )}
        </motion.div>

        {/* Invite section */}
        <motion.div
          variants={slideUp}
          className="bg-cosmos-2 border border-cosmos-4 p-5 mb-6"
        >
          <p className="font-space-mono text-[10px] text-void tracking-widest mb-3 uppercase">
            Invite Players
          </p>
          <InviteSharePanel roomId={roomId} qrSize={108} />
        </motion.div>

        {isAdmin ? (
          <motion.div
            variants={slideUp}
            className="bg-cosmos-2 border border-cosmos-4 p-5"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="relative flex h-2 w-2" aria-hidden>
                <span className="absolute inset-0 rounded-full bg-success animate-[livepulse_1.5s_ease-in-out_infinite]" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
              </span>
              <p className="font-space-mono text-[10px] text-void tracking-widest uppercase">
                Friends online
              </p>
            </div>
            <OnlineFriendsList
              roomId={roomId}
              variant="lobby"
              excludeUserIds={players.map((p) => p.userId)}
              emptyMessage="No friends online right now. Share the invite link above — they'll appear here once they're in the app."
              onNotify={(message, type = "info") => toast({ type, title: message })}
            />
          </motion.div>
        ) : null}
      </motion.div>
    </AppLayout>
  );
}
