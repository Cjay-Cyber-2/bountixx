"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Zap, Trophy, TrendingUp, Coins, Swords, ArrowRight } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { AppLayout } from "@/components/layout/AppLayout";
import { APP_GUTTERS } from "@/components/landing/_section";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { Button } from "@/components/ui/Button";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

const CATEGORY_COLORS: Record<string, string> = {
  coding: "#a855f7", trivia: "#9B6BFF", logic: "#8660fa", math: "#c084fc",
};

const RESULT_COLORS: Record<string, string> = {
  "1st": "#F0A500", "2nd": "#9B8FC0", "3rd": "#7A6FAE", "—": "#9B6BFF",
};

function LiveClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="font-space-mono text-xs text-haze-3 tabular-nums">{time}</span>;
}

type DashboardData = {
  roomsCreated: number;
  roomsWon: number;
  totalXp: number;
  coinsBalance: number;
  recentRooms: { name: string; category: string; place: string; coins: number; date: string }[];
  onlineUsers: { id: string; username: string; rank: string; avatarUrl: string | null; initials: string }[];
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

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
    const id = setInterval(fetchData, 30_000);
    return () => clearInterval(id);
  }, [fetchData]);

  const statCards = [
    { label: "Rooms created",  value: data?.roomsCreated  ?? 0, icon: Swords,     accent: "var(--void)",  accentRaw: "#9B6BFF" },
    { label: "Rooms won",      value: data?.roomsWon      ?? 0, icon: Trophy,     accent: "var(--void)",  accentRaw: "#9B6BFF" },
    { label: "Total XP",       value: data?.totalXp       ?? 0, icon: TrendingUp,  accent: "var(--void)",  accentRaw: "#9B6BFF" },
    { label: "Coin balance",   value: data?.coinsBalance  ?? 0, icon: Coins,      accent: "#F0A500",      accentRaw: "#F0A500", gold: true },
  ];

  return (
    <AppLayout>
      <div className={`${APP_GUTTERS} py-8 md:py-12 lg:py-14`}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-9"
        >
          <div>
            <p className="font-space-mono text-[11px] text-haze-3 tracking-[3px] uppercase mb-1.5">
              Welcome back
            </p>
            <h1 className="font-zen-dots text-2xl md:text-3xl text-haze leading-tight">Arena Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <LiveClock />
            <Link href="/create">
              <Button variant="primary" magnetic>
                <Zap size={14} className="mr-1.5" aria-hidden />
                New Arena
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.07 } } }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-px mb-10"
          style={{ background: "var(--border-1)" }}
        >
          {statCards.map((s) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
                className="relative bg-cosmos-2 p-5 md:p-6 overflow-hidden group"
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: `radial-gradient(circle at 85% 15%, ${s.accentRaw}18, transparent 60%)` }}
                  aria-hidden
                />
                <div
                  className="w-9 h-9 mb-4 flex items-center justify-center clip-arena-sm"
                  style={{ background: `${s.accentRaw}14`, border: `1px solid ${s.accentRaw}33` }}
                >
                  <Icon size={16} style={{ color: s.accent }} aria-hidden />
                </div>
                {loading ? (
                  <div className="h-8 w-16 bg-cosmos-3 animate-pulse mb-1.5" />
                ) : (
                  <AnimatedNumber
                    value={s.value}
                    className="font-orbitron font-black text-2xl md:text-3xl block leading-none mb-1.5"
                    style={{ color: s.gold ? "#F0A500" : "var(--haze)" }}
                  />
                )}
                <p className="font-space-mono text-[9px] text-haze-3 tracking-[2px] uppercase">{s.label}</p>
              </motion.div>
            );
          })}
        </motion.div>

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
                {data?.onlineUsers?.length ?? 0} live
              </span>
            </div>
            <div className="space-y-2.5">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-cosmos-3 animate-pulse shrink-0" />
                    <div className="flex-1">
                      <div className="h-3 w-24 bg-cosmos-3 animate-pulse mb-1.5" />
                      <div className="h-2 w-16 bg-cosmos-3 animate-pulse" />
                    </div>
                  </div>
                ))
              ) : !data?.onlineUsers?.length ? (
                <p className="font-space-mono text-[10px] text-haze-3 text-center py-6">
                  No one else online right now
                </p>
              ) : (
                data?.onlineUsers?.map((p) => (
                  <OnlinePlayerRow key={p.id} player={p} />
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* Recent arenas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-zen-dots text-lg text-haze">Recent arenas</h3>
            <Link
              href="/profile/me"
              className="cursor-target font-space-mono text-[10px] text-haze-3 hover:text-void transition-colors tracking-widest uppercase"
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

      </div>
    </AppLayout>
  );
}

function OnlinePlayerRow({
  player,
}: {
  player: { id: string; username: string; rank: string; avatarUrl: string | null; initials: string };
}) {
  const [invited, setInvited] = useState(false);
  const RANK_COLORS: Record<string, string> = {
    LEGENDARY: "#FF6B1A", CHAMPION: "#F0A500", ELITE: "#00D68F",
    CHALLENGER: "#9B6BFF", RECRUIT: "var(--haze-3)",
  };
  const color = RANK_COLORS[player.rank] ?? "var(--haze-3)";

  return (
    <div className="flex items-center gap-3 group">
      <div
        className="w-9 h-9 rounded-full bg-cosmos-3 border-2 flex items-center justify-center shrink-0 overflow-hidden"
        style={{ borderColor: `${color}44` }}
      >
        {player.avatarUrl ? (
          <img src={player.avatarUrl} alt={player.username} className="w-full h-full object-cover" />
        ) : (
          <span className="font-orbitron font-bold text-[10px] text-haze">{player.initials}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-rajdhani font-semibold text-sm text-haze leading-none truncate">@{player.username}</p>
        <p className="font-space-mono text-[9px] mt-1" style={{ color }}>{player.rank}</p>
      </div>
      <button
        onClick={() => {
          setInvited(true);
          setTimeout(() => setInvited(false), 2000);
        }}
        className={`cursor-target shrink-0 font-space-mono text-[10px] px-3 py-1 transition-all ${
          invited
            ? "text-success"
            : "text-haze-3 sm:opacity-0 sm:group-hover:opacity-100 hover:text-void"
        }`}
        style={{
          border: invited ? "1px solid rgba(0,214,143,0.4)" : "1px solid var(--border-1)",
          background: invited ? "rgba(0,214,143,0.08)" : "transparent",
        }}
      >
        {invited ? "Sent ✓" : "Invite"}
      </button>
    </div>
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
