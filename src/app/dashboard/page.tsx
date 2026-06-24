"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Zap, Trophy, TrendingUp, Coins, Swords, ArrowRight } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppPage } from "@/components/landing/_section";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { friendlyErrorMessage } from "@/lib/apiErrors";
import { Button } from "@/components/ui/Button";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { useToast } from "@/components/ui/Toast";
import { OnlineFriendsList } from "@/components/arena/OnlineFriendsList";

const CATEGORY_COLORS: Record<string, string> = {
  coding:  "#7C5CFF",
  trivia:  "#A78BFA",
  logic:   "#22D3EE",
  math:    "#F0A500",
  writing: "#F472B6",
  design:  "#34D399",
  meme:    "#FB7185",
};

const RESULT_COLORS: Record<string, string> = {
  "1st": "#F0A500", "2nd": "#A78BFA", "3rd": "#7A6FAE", "—": "#7C5CFF",
};

type DashboardData = {
  roomsCreated: number;
  roomsWon: number;
  totalXp: number;
  coinsBalance: number;
  coinsUnlimited?: boolean;
  recentRooms: { name: string; category: string; place: string; coins: number; date: string }[];
  onlineUsers: { id: string; username: string; rank: string; avatarUrl: string | null; initials: string }[];
  activeLobby: { id: string; name: string } | null;
  pendingInvites: { id: string; roomId: string; roomName: string; inviterName: string }[];
};

const MAX_AUTH_RETRIES = 4;
const RETRY_DELAY_MS = 600;

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const hasDataRef = useRef(false);

  useEffect(() => {
    hasDataRef.current = data !== null;
  }, [data]);

  const fetchData = useCallback(async () => {
    if (authLoading || !user) return;

    for (let attempt = 0; attempt < MAX_AUTH_RETRIES; attempt += 1) {
      try {
        const res = await fetchWithAuth("/api/dashboard");
        if (res.status === 401 && attempt < MAX_AUTH_RETRIES - 1) {
          await sleep(RETRY_DELAY_MS * (attempt + 1));
          continue;
        }
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string; code?: string };
          if (!hasDataRef.current) {
            setLoadError(friendlyErrorMessage(res.status, body));
          }
          setLoading(false);
          return;
        }

        const d = (await res.json()) as DashboardData;
        setData(d);
        setLoadError(null);
        setLoading(false);
        return;
      } catch {
        if (!hasDataRef.current) {
          setLoadError("We couldn't reach the server. Check your connection and try again.");
        }
        setLoading(false);
        return;
      }
    }
    setLoading(false);
  }, [authLoading, user]);

  useEffect(() => {
    if (authLoading || !user) return;

    void fetchData();
    const id = setInterval(() => void fetchData(), 15_000);

    const refresh = () => {
      if (document.visibilityState === "visible") void fetchData();
    };
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [authLoading, fetchData, user]);

  const statCards = [
    { label: "Rooms created",  value: data?.roomsCreated  ?? 0, icon: Swords,     accent: "var(--brand-primary)",  accentRaw: "#7C5CFF" },
    { label: "Rooms won",      value: data?.roomsWon      ?? 0, icon: Trophy,     accent: "var(--brand-primary)",  accentRaw: "#7C5CFF" },
    { label: "Total XP",       value: data?.totalXp       ?? 0, icon: TrendingUp, accent: "var(--brand-primary)",  accentRaw: "#7C5CFF" },
    { label: "Coin balance",   value: data?.coinsBalance  ?? 0, icon: Coins,      accent: "var(--coin-gold-text)", accentRaw: "#F0A500", gold: true },
  ];

  return (
    <AppLayout>
      <AppPage>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-2 mb-10 md:mb-14"
        >
          <p className="font-mono text-xs sm:text-sm text-[var(--brand-primary)] uppercase tracking-[3px]">
            Welcome back
          </p>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-haze leading-[1.05] mt-2">
            Arena Dashboard
          </h1>
        </motion.div>

        {loadError && !data ? (
          <div className="mb-8 rounded-xl border border-danger/40 bg-danger/10 px-5 py-4">
            <p className="font-rajdhani text-sm text-danger">{loadError}</p>
          </div>
        ) : null}

        {/* Stats */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.07 } } }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-12 md:mb-14"
        >
          {statCards.map((s) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
                className="relative flex min-h-[148px] flex-col rounded-xl border border-[var(--border-1)] bg-[var(--surface-inset)] p-6 sm:p-8 md:p-9 group shadow-sm"
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-xl"
                  style={{ background: `radial-gradient(circle at 85% 15%, ${s.accentRaw}18, transparent 60%)` }}
                  aria-hidden
                />
                <div
                  className="relative z-[1] mb-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: `${s.accentRaw}14`, border: `1px solid ${s.accentRaw}33` }}
                >
                  <Icon size={18} style={{ color: s.accent }} aria-hidden />
                </div>
                <div className="relative z-[1] mt-auto">
                {loading ? (
                  <div className="mb-2 h-9 w-20 animate-pulse rounded bg-cosmos-3" />
                ) : s.gold && data?.coinsUnlimited ? (
                  <span
                    className="font-orbitron font-black text-2xl md:text-3xl block leading-tight mb-2"
                    style={{ color: s.gold ? "var(--coin-gold-text)" : "var(--haze)" }}
                  >
                    ∞
                  </span>
                ) : (
                  <AnimatedNumber
                    value={s.value}
                    className="font-orbitron font-black text-2xl md:text-3xl block leading-tight mb-2"
                    style={{ color: s.gold ? "var(--coin-gold-text)" : "var(--haze)" }}
                  />
                )}
                <p className="font-space-mono text-[11px] sm:text-xs text-haze-2 tracking-wide uppercase leading-snug break-words hyphens-auto">
                  {s.label}
                </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {!!data?.pendingInvites?.length && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.45 }}
            className="mb-10 p-5"
            style={{ background: "var(--void-tint)", border: "1px solid var(--border-accent)" }}
          >
            <p className="font-space-mono text-[10px] text-void tracking-widest uppercase mb-3">
              Arena invites
            </p>
            <div className="space-y-3">
              {data.pendingInvites.map((inv) => (
                <div key={inv.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="font-rajdhani text-sm text-haze">
                    <span className="text-void">@{inv.inviterName}</span> invited you to{" "}
                    <span className="font-semibold">{inv.roomName}</span>
                  </p>
                  <Link href={`/join/${inv.roomId}`}>
                    <Button variant="primary" size="sm" className="w-full sm:w-auto">
                      Join arena
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Create CTA + Online */}
        <div className="grid lg:grid-cols-2 gap-6 md:gap-8 mb-12 md:mb-16">
          {/* Create arena CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="relative overflow-hidden rounded-2xl p-8 md:p-10 flex flex-col gap-7 shadow-sm"
            style={{
              background: "var(--void-tint)",
              border: "1px solid var(--border-accent)",
            }}
          >
            <div
              className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-40 pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(124,92,255,0.55), transparent 70%)" }}
              aria-hidden
            />
            <div className="relative w-12 h-12 flex items-center justify-center">
              <span
                className="absolute inset-0 rounded-full border animate-[pulsering_2s_ease-out_infinite]"
                style={{ borderColor: "var(--border-accent)" }}
                aria-hidden
              />
              <span
                className="absolute inset-0 scale-125 rounded-full border animate-[pulsering_2s_ease-out_infinite_0.6s]"
                style={{ borderColor: "var(--border-2)" }}
                aria-hidden
              />
              <Zap size={24} className="text-[var(--brand-primary)] relative z-10" aria-hidden />
            </div>
            <div>
              <h2 className="font-display text-2xl md:text-3xl text-haze mb-3 leading-tight">Ready to compete?</h2>
              <p className="font-body text-base md:text-lg text-haze-2 leading-relaxed">
                Drop any challenge. Lock the room. One winner claims the bounty.
              </p>
            </div>
            <Link href="/create" className="mt-auto">
              <Button variant="primary" magnetic size="lg" className="w-full justify-center gap-2">
                Create arena <ArrowRight size={16} aria-hidden />
              </Button>
            </Link>
          </motion.div>

          {/* Who's online */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="rounded-2xl p-7 md:p-9 shadow-sm"
            style={{ background: "var(--surface-inset)", border: "1px solid var(--border-1)" }}
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="relative flex h-2.5 w-2.5" aria-hidden>
                <span className="absolute inset-0 rounded-full bg-success animate-[livepulse_1.5s_ease-in-out_infinite]" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
              </span>
              <span className="font-display text-lg md:text-xl text-haze tracking-wide">Who&apos;s online</span>
              <span className="ml-auto font-mono text-[11px] text-haze-3 tracking-wider">
                {onlineCount > 0 ? `${onlineCount} online` : "live"}
              </span>
            </div>
            <OnlineFriendsList
              initialUsers={data?.onlineUsers}
              activeLobby={data?.activeLobby ?? null}
              onCountChange={setOnlineCount}
              onNotify={(message, type = "info") => toast({ type, title: message })}
            />
            {!data?.activeLobby ? (
              <p className="font-body text-sm md:text-base text-haze-3 mt-5 text-center leading-relaxed">
                Create an arena to invite online friends from here.
              </p>
            ) : null}
          </motion.div>
        </div>

        {/* Recent arenas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <div className="flex items-baseline justify-between gap-3 mb-5">
            <h3 className="font-display text-xl md:text-2xl text-haze">Recent arenas</h3>
            <Link
              href="/profile/me"
              className="cursor-target font-mono text-[11px] text-haze-3 hover:text-[var(--brand-primary)] transition-colors tracking-widest uppercase"
            >
              View all →
            </Link>
          </div>

          {loading ? (
            <div className="rounded-2xl overflow-hidden border border-[var(--border-1)]">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 px-5 md:px-7 py-4 bg-[var(--surface-inset)] border-b border-[var(--border-1)] last:border-0"
                >
                  <div className="w-2 h-2 rounded-full bg-cosmos-4 shrink-0" />
                  <div className="flex-1">
                    <div className="h-3.5 w-40 bg-cosmos-3 animate-pulse mb-1.5 rounded" />
                    <div className="h-2.5 w-28 bg-cosmos-3 animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : !data?.recentRooms?.length ? (
            <div className="rounded-2xl p-12 text-center bg-[var(--surface-inset)] border border-[var(--border-1)]">
              <p className="font-display text-lg md:text-xl text-haze mb-2">No arenas yet</p>
              <p className="font-body text-sm md:text-base text-haze-3">
                Create or join an arena to see your history here.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden border border-[var(--border-1)]">
              {data.recentRooms.map((room, i) => (
                <RoomRow key={i} room={room} />
              ))}
            </div>
          )}
        </motion.div>
      </AppPage>
    </AppLayout>
  );
}

function RoomRow({
  room,
}: {
  room: { name: string; category: string; place: string; coins: number; date: string };
}) {
  const catColor = CATEGORY_COLORS[room.category] ?? "var(--haze-3)";
  const resColor = RESULT_COLORS[room.place] ?? "var(--haze-3)";

  return (
    <div
      className="flex items-center gap-4 px-5 md:px-7 py-4 transition-colors last:border-0"
      style={{
        background: "var(--surface-inset)",
        borderBottom: "1px solid var(--border-1)",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-hover)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "var(--surface-inset)")}
    >
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: catColor }} aria-hidden />
      <div className="flex-1 min-w-0">
        <p className="font-body font-semibold text-sm md:text-base text-haze truncate">{room.name}</p>
        <p className="font-mono text-[10px] md:text-xs text-haze-3 mt-1">
          <span style={{ color: catColor }}>{room.category}</span> · {room.date}
        </p>
      </div>
      <span className="font-stats font-bold text-sm shrink-0 w-14 text-right tracking-wide" style={{ color: resColor }}>
        {room.place}
      </span>
    </div>
  );
}
