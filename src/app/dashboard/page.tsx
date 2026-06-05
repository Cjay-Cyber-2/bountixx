"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Zap, Bell, Circle, Trophy, TrendingUp, Coins, Swords } from "lucide-react";
import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { staggerContainer, slideUp, fadeIn } from "@/lib/animations";

const STAT_CARDS = [
  { label: "ROOMS CREATED", value: 24,   color: "var(--ignite)", icon: Swords,     glow: "#FF6B1A" },
  { label: "ROOMS WON",     value: 11,   color: "var(--crown)",  icon: Trophy,     glow: "#F0A500" },
  { label: "TOTAL XP",      value: 6820, color: "var(--void)",   icon: TrendingUp, glow: "#9B6BFF" },
  { label: "COIN BALANCE",  value: 450,  color: "var(--crown)",  icon: Coins,      glow: "#F0A500", coin: true },
];

const ONLINE_PLAYERS = [
  { name: "zainab_codes", rank: "ELITE",      initials: "ZC", rankColor: "#F0A500" },
  { name: "dev_tolu",     rank: "CHAMPION",   initials: "DT", rankColor: "#9B6BFF" },
  { name: "chisom_x",     rank: "LEGENDARY",  initials: "CX", rankColor: "#FF6B1A" },
  { name: "code_chief",   rank: "CHALLENGER", initials: "CC", rankColor: "#E8E0FF" },
  { name: "ade_logic",    rank: "ELITE",      initials: "AL", rankColor: "#F0A500" },
];

const RECENT_ROOMS = [
  { name: "String Reversal Clash", category: "Coding", players: "8/8", status: "ENDED", result: "WON",  resultColor: "var(--crown)",  date: "2h ago"  },
  { name: "Capital Cities Rush",   category: "Trivia", players: "4/4", status: "ENDED", result: "2ND",  resultColor: "var(--haze-2)", date: "5h ago"  },
  { name: "Regex Warfare",         category: "Coding", players: "6/6", status: "LIVE",  result: "—",    resultColor: "var(--haze-2)", date: "NOW"     },
  { name: "Math Sprint",           category: "Math",   players: "5/5", status: "ENDED", result: "LOST", resultColor: "var(--haze-3)", date: "1d ago"  },
];

const CATEGORY_COLORS: Record<string, string> = {
  Coding: "#FF6B1A",
  Trivia: "#9B6BFF",
  Math:   "#00D68F",
};

function LiveClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="font-share-mono text-xs text-haze-3">{time}</span>;
}

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="max-w-[1320px] mx-auto px-5 md:px-8 lg:px-12 py-10">

        {/* ── Greeting row ── */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="show"
          className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12"
        >
          <div>
            <p className="font-share-mono text-xs text-haze-3 tracking-[3px] uppercase mb-2">
              Welcome back, Champion
            </p>
            <h1 className="font-orbitron font-black text-3xl md:text-4xl text-haze leading-tight">
              ARENA DASHBOARD
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <LiveClock />
            <Link href="/create">
              <Button variant="primary" magnetic>
                <Zap size={14} className="mr-1.5" aria-hidden />
                NEW ARENA
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* ── Stat cards ── */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12"
        >
          {STAT_CARDS.map((s) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                variants={slideUp}
                className="relative bg-cosmos-2 border border-cosmos-4 clip-arena p-6 overflow-hidden group hover:border-cosmos-3 transition-colors"
              >
                {/* Ambient glow on hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: `radial-gradient(circle at 80% 20%, ${s.glow}18, transparent 60%)` }}
                  aria-hidden
                />
                <Icon
                  size={20}
                  className="mb-4 opacity-40"
                  style={{ color: s.color }}
                  aria-hidden
                />
                <AnimatedNumber
                  value={s.value}
                  className="font-orbitron font-black text-5xl block mb-2"
                  style={{ color: s.color }}
                />
                <p className="font-share-mono text-[9px] text-haze-3 tracking-[3px] uppercase">
                  {s.label}
                </p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ── Two-column section: Create CTA + Online Now ── */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">

          {/* Create Arena CTA */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.55 }}
            className="relative overflow-hidden bg-cosmos-2 border border-ignite/25 p-8 flex flex-col gap-5"
            style={{ background: "rgba(255,107,26,0.04)" }}
          >
            {/* Decorative gradient blob */}
            <div
              className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-30 pointer-events-none"
              style={{ background: "radial-gradient(circle, #FF6B1A55, transparent 70%)" }}
              aria-hidden
            />
            {/* Pulse Zap */}
            <div className="relative w-12 h-12 flex items-center justify-center">
              <span className="absolute inset-0 rounded-full border border-ignite/40 animate-[pulsering_2s_ease-out_infinite]" aria-hidden />
              <span className="absolute inset-0 scale-125 rounded-full border border-ignite/20 animate-[pulsering_2s_ease-out_infinite_0.6s]" aria-hidden />
              <Zap size={24} className="text-ignite relative z-10" aria-hidden />
            </div>
            <div>
              <h2 className="font-orbitron font-bold text-xl text-haze mb-2 leading-tight">
                READY TO COMPETE?
              </h2>
              <p className="font-rajdhani text-base text-haze-2 leading-relaxed">
                Drop any challenge. Lock the room. One winner claims the bounty.
              </p>
            </div>
            <Link href="/create">
              <Button variant="primary" magnetic className="w-full justify-center">
                CREATE ARENA →
              </Button>
            </Link>
          </motion.div>

          {/* Online now */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.55 }}
            className="bg-cosmos-2 border border-cosmos-4 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="relative flex items-center justify-center w-2.5 h-2.5">
                <span className="absolute inset-0 rounded-full bg-success animate-[livepulse_1.5s_ease-in-out_infinite]" aria-hidden />
                <Circle size={10} className="text-success fill-success relative z-10" aria-hidden />
              </span>
              <span className="font-orbitron font-bold text-sm text-haze tracking-wider">
                WHO'S ONLINE
              </span>
              <span className="ml-auto font-share-mono text-[10px] text-haze-3">
                {ONLINE_PLAYERS.length} LIVE
              </span>
            </div>

            <div className="space-y-3">
              {ONLINE_PLAYERS.map((p) => (
                <OnlinePlayerRow key={p.name} player={p} />
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── Recent Arenas ── */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.55 }}
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-orbitron font-bold text-base text-haze tracking-wide">
              RECENT ARENAS
            </h3>
            <Link
              href="/profile/me"
              className="font-share-mono text-[10px] text-haze-3 hover:text-ignite transition-colors tracking-widest"
            >
              VIEW ALL →
            </Link>
          </div>

          <div className="border border-cosmos-4 overflow-hidden">
            {RECENT_ROOMS.map((room, i) => (
              <RoomRow key={room.name} room={room} even={i % 2 === 0} />
            ))}
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}

function OnlinePlayerRow({ player }: { player: typeof ONLINE_PLAYERS[0] }) {
  const [invited, setInvited] = useState(false);

  return (
    <div className="flex items-center gap-3 group">
      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-full bg-cosmos-3 border-2 flex items-center justify-center shrink-0"
        style={{ borderColor: `${player.rankColor}60` }}
      >
        <span className="font-orbitron font-bold text-[10px] text-haze">{player.initials}</span>
      </div>

      {/* Name + rank */}
      <div className="flex-1 min-w-0">
        <p className="font-rajdhani font-semibold text-sm text-haze leading-none truncate">
          @{player.name}
        </p>
        <p className="font-share-mono text-[9px] mt-0.5" style={{ color: player.rankColor }}>
          {player.rank}
        </p>
      </div>

      {/* Invite button */}
      <button
        onClick={() => { setInvited(true); setTimeout(() => setInvited(false), 2000); }}
        className={`shrink-0 font-share-mono text-[10px] px-3 py-1 border transition-all ${
          invited
            ? "border-success/50 text-success bg-success/10"
            : "border-cosmos-4 text-haze-3 opacity-0 group-hover:opacity-100 hover:border-ignite/50 hover:text-ignite"
        }`}
      >
        {invited ? "SENT ✓" : "INVITE"}
      </button>
    </div>
  );
}

function RoomRow({ room, even }: { room: typeof RECENT_ROOMS[0]; even: boolean }) {
  const catColor = CATEGORY_COLORS[room.category] ?? "var(--haze-3)";

  return (
    <div
      className={`flex items-center gap-4 px-5 py-4 hover:bg-cosmos-3 transition-colors border-b border-cosmos-4 last:border-0 ${
        even ? "bg-cosmos-2" : ""
      }`}
    >
      {/* Name */}
      <p className="font-rajdhani font-bold text-sm text-haze flex-1 truncate min-w-0">{room.name}</p>

      {/* Category badge */}
      <span
        className="font-share-mono text-[10px] px-2 py-0.5 border shrink-0"
        style={{ color: catColor, borderColor: `${catColor}40`, background: `${catColor}10` }}
      >
        {room.category}
      </span>

      {/* Players */}
      <span className="font-share-mono text-[10px] text-haze-3 shrink-0">{room.players}</span>

      {/* Status */}
      {room.status === "LIVE" ? (
        <span className="flex items-center gap-1.5 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-ignite animate-[livepulse_1.5s_ease-in-out_infinite] inline-block" aria-hidden />
          <span className="font-share-mono text-[10px] text-ignite">LIVE</span>
        </span>
      ) : (
        <span className="font-share-mono text-[10px] text-haze-3 shrink-0">{room.status}</span>
      )}

      {/* Result */}
      <span
        className="font-orbitron font-bold text-xs shrink-0 w-10 text-right"
        style={{ color: room.resultColor }}
      >
        {room.result}
      </span>

      {/* Date */}
      <span className="font-share-mono text-[10px] text-haze-3 shrink-0 w-12 text-right">
        {room.date}
      </span>
    </div>
  );
}
