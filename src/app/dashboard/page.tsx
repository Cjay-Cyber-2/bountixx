"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Zap, Trophy, TrendingUp, Coins, Swords, ArrowRight } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppPage } from "@/components/landing/_section";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { Button } from "@/components/ui/Button";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { useToast } from "@/components/ui/Toast";
import { OnlineFriendsList } from "@/components/arena/OnlineFriendsList";
import { ENTRY_FEE, ENTRY_FEE_SUMMARY, MAIN_EVENT_STARTER_SUMMARY, STARTER_COINS } from "@/lib/coins";

const CATEGORY_COLORS: Record<string, string> = {
  coding: "#a855f7", trivia: "#9B6BFF", logic: "#8660fa", math: "#c084fc",
};

const RESULT_COLORS: Record<string, string> = {
  "1st": "#F0A500", "2nd": "#9B8FC0", "3rd": "#7A6FAE", "—": "#9B6BFF",
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

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [onlineCount, setOnlineCount] = useState(0);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetchWithAuth("/api/dashboard");
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch {
      // fail gracefully
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
    const id = setInterval(() => fetchData(), 5_000);
    return () => clearInterval(id);
  }, [fetchData]);

  const statCards = [
    { label: "Rooms created",  value: data?.roomsCreated  ?? 0, icon: Swords,     accent: "var(--brand-primary)",  accentRaw: "#F92313" },
    { label: "Rooms won",      value: data?.roomsWon      ?? 0, icon: Trophy,     accent: "var(--brand-primary)",  accentRaw: "#F92313" },
    { label: "Total XP",       value: data?.totalXp       ?? 0, icon: TrendingUp,  accent: "var(--brand-primary)",  accentRaw: "#F92313" },
    { label: "Coin balance",   value: data?.coinsBalance  ?? 0, icon: Coins,      accent: "var(--brand-primary)",  accentRaw: "#F92313", gold: true },
  ];

  return (
    <AppLayout>
      <AppPage>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-1.5 mb-8"
        >
          <div>
            <p className="font-space-mono text-[10px] text-plum uppercase tracking-widest">
              Welcome back
            </p>
            <h1 className="font-display text-4xl md:text-5xl text-haze leading-tight mt-1">Arena Dashboard</h1>
          </div>
        </motion.div>

        {/* Main event + economy */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.45 }}
          className="mb-8 rounded-xl border border-[var(--border-accent)] bg-[var(--void-tint)] px-5 py-4 md:px-6 md:py-5"
        >
          <p className="font-space-mono text-[10px] text-plum tracking-widest uppercase mb-2">Main event live</p>
          <p className="font-rajdhani text-sm md:text-base text-haze leading-relaxed mb-2">
            {MAIN_EVENT_STARTER_SUMMARY}
          </p>
          <p className="font-rajdhani text-sm text-haze-2 leading-relaxed">
            Arena entry costs <span className="text-coin-gold font-semibold">{ENTRY_FEE} coins</span> per competing player — that fee builds the bounty the winner claims.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.07 } } }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12 md:mb-14"
        >
          {statCards.map((s) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
                className="relative flex min-h-[148px] flex-col rounded-xl border border-[var(--border-1)] bg-[var(--surface-inset)] p-5 sm:p-6 md:p-7 group shadow-sm"
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
        <div className="grid lg:grid-cols-2 gap-4 md:gap-6 mb-10">
          {/* Create arena CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="relative overflow-hidden p-7 md:p-8 flex flex-col gap-5"
            style={{
              background: "var(--void-tint)",
              border: "1px solid var(--border-accent)",
            }}
          >
            <div
              className="absolute -top-10 -right-10 w-44 h-44 rounded-full opacity-30 pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(155,107,255,0.5), transparent 70%)" }}
              aria-hidden
            />
            <div className="relative w-11 h-11 flex items-center justify-center">
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
              <Zap size={22} className="text-void relative z-10" aria-hidden />
            </div>
            <div>
              <h2 className="font-zen-dots text-xl text-haze mb-2 leading-tight">Ready to compete?</h2>
              <p className="font-rajdhani text-base text-haze-2 leading-relaxed">
                Drop any challenge. Lock the room. One winner claims the bounty.
              </p>
            </div>
            <Link href="/create" className="mt-auto">
              <Button variant="primary" magnetic className="w-full justify-center gap-2">
                Create arena <ArrowRight size={15} aria-hidden />
              </Button>
            </Link>
          </motion.div>

          {/* Who's online */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="p-6"
            style={{ background: "var(--cosmos-2)", border: "1px solid var(--border-1)" }}
          >
            <div className="flex items-center gap-3 mb-5">
              <span className="relative flex h-2 w-2" aria-hidden>
                <span className="absolute inset-0 rounded-full bg-success animate-[livepulse_1.5s_ease-in-out_infinite]" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
              </span>
              <span className="font-zen-dots text-base text-haze tracking-wide">Who&apos;s online</span>
              <span className="ml-auto font-space-mono text-[10px] text-haze-3">
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
                <p className="font-space-mono text-sm text-haze-3 mt-4 text-center leading-relaxed">
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
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4 text-center">
            <h3 className="font-zen-dots text-lg text-haze">Recent arenas</h3>
            <Link
              href="/profile/me"
              className="cursor-target font-space-mono text-[10px] text-haze-3 hover:text-void transition-colors tracking-widest uppercase hidden sm:inline"
            >
              View all →
            </Link>
          </div>

          {loading ? (
            <div
              className="overflow-hidden"
              style={{ border: "1px solid var(--border-1)" }}
            >
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-5 py-3.5"
                  style={{ background: "var(--cosmos-2)", borderBottom: "1px solid var(--border-1)" }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-cosmos-4 shrink-0" />
                  <div className="flex-1">
                    <div className="h-3 w-40 bg-cosmos-3 animate-pulse mb-1.5" />
                    <div className="h-2 w-28 bg-cosmos-3 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : !data?.recentRooms?.length ? (
            <div
              className="p-10 text-center"
              style={{ background: "var(--cosmos-2)", border: "1px solid var(--border-1)" }}
            >
              <p className="font-zen-dots text-base text-haze-2 mb-2">No arenas yet</p>
              <p className="font-space-mono text-[10px] text-haze-3">
                Create or join an arena to see your history here.
              </p>
            </div>
          ) : (
            <div
              className="overflow-hidden"
              style={{ border: "1px solid var(--border-1)" }}
            >
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
      className="flex items-center gap-3 px-4 md:px-5 py-3.5 transition-colors last:border-0"
      style={{
        background: "var(--cosmos-2)",
        borderBottom: "1px solid var(--border-1)",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-hover)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "var(--cosmos-2)")}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: catColor }} aria-hidden />
      <div className="flex-1 min-w-0">
        <p className="font-rajdhani font-bold text-sm text-haze truncate">{room.name}</p>
        <p className="font-space-mono text-[10px] text-haze-3 mt-0.5">
          <span style={{ color: catColor }}>{room.category}</span> · {room.date}
        </p>
      </div>
      <span className="font-space-mono font-bold text-xs shrink-0 w-12 text-right tracking-wide" style={{ color: resColor }}>
        {room.place}
      </span>
    </div>
  );
}
