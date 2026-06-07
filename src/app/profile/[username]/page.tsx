"use client";

import { motion } from "framer-motion";
import { Lock, Trophy } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { XPBar } from "@/components/ui/XPBar";

const STATS = [
  { label: "Arenas played", value: 124 },
  { label: "Arenas won", value: 58 },
  { label: "Win rate", value: 47, suffix: "%" },
  { label: "Total XP", value: 6820 },
];

const ACHIEVEMENTS = [
  { name: "First Blood", desc: "Win your first arena", earned: true },
  { name: "Hat Trick", desc: "Win 3 arenas in a row", earned: true },
  { name: "Perfectionist", desc: "Pass 20/20 hidden tests", earned: true },
  { name: "Speed Demon", desc: "Submit in under 60 seconds", earned: false },
  { name: "Veteran", desc: "Complete 100 arenas", earned: true },
  { name: "Legend", desc: "Reach Legendary rank", earned: false },
];

const HISTORY = [
  { name: "String Reversal Clash", category: "Coding", place: "1st", coins: 300, date: "Jun 4" },
  { name: "Capital Cities Rush", category: "Trivia", place: "2nd", coins: 150, date: "Jun 3" },
  { name: "Regex Warfare", category: "Coding", place: "1st", coins: 300, date: "Jun 2" },
];

const CATEGORY_COLORS: Record<string, string> = { Coding: "#FF6B1A", Trivia: "#9B6BFF", Logic: "#00D68F", Math: "#F0A500" };

export default function ProfilePage() {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        {/* Banner */}
        <div
          className="relative overflow-hidden border-b border-cosmos-4"
          style={{
            background:
              "repeating-linear-gradient(135deg, rgba(45,27,105,0.25) 0 1px, transparent 1px 20px)",
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 70% 100% at 20% 100%, rgba(155,107,255,0.12), transparent 70%)" }}
            aria-hidden
          />
          <div className="relative px-5 md:px-10 pt-8 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div className="flex items-end gap-4">
                <div
                  className="w-20 h-20 rounded-full bg-cosmos-3 flex items-center justify-center shrink-0"
                  style={{ border: "3px solid #9B6BFF", boxShadow: "0 0 24px rgba(155,107,255,0.3)" }}
                >
                  <span className="font-orbitron font-bold text-2xl text-void">AP</span>
                </div>
                <div>
                  <h1 className="font-zen-dots text-xl md:text-2xl text-haze">@arena_player</h1>
                  <div className="flex items-center gap-2.5 mt-1.5">
                    <span className="font-space-mono text-[10px] px-2 py-0.5 text-void" style={{ background: "rgba(155,107,255,0.12)", border: "1px solid rgba(155,107,255,0.3)" }}>
                      CHAMPION
                    </span>
                    <span className="font-space-mono text-[10px] text-haze-3">Joined Jan 2025</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                <span className="font-space-mono text-[9px] text-haze-3 tracking-[2px] uppercase">Balance</span>
                <span className="font-orbitron font-bold text-2xl text-crown">450 <span className="text-xs">◈</span></span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 md:px-10 py-8 flex flex-col gap-9">
          {/* Stats */}
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.07 } } }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4"
          >
            {STATS.map((s) => (
              <motion.div
                key={s.label}
                variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
                className="bg-cosmos-2 clip-arena p-5"
                style={{ border: "1px solid rgba(45,27,105,0.7)" }}
              >
                <AnimatedNumber
                  value={s.value}
                  suffix={s.suffix}
                  className="font-orbitron font-black text-2xl md:text-3xl text-haze block mb-1.5 leading-none"
                  format={!s.suffix}
                />
                <p className="font-space-mono text-[9px] text-haze-3 tracking-[2px] uppercase">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* XP */}
          <div className="bg-cosmos-2 clip-arena p-6" style={{ border: "1px solid rgba(45,27,105,0.7)" }}>
            <div className="flex items-center justify-between mb-4">
              <p className="font-orbitron font-bold text-sm text-haze tracking-wide">CHAMPION</p>
              <p className="font-space-mono text-[11px] text-void">6,820 / 10,000 XP → LEGENDARY</p>
            </div>
            <XPBar current={6820} max={10000} thick color="void" />
          </div>

          {/* Achievements */}
          <div>
            <h2 className="font-orbitron font-bold text-base text-haze tracking-wide mb-4">ACHIEVEMENTS</h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {ACHIEVEMENTS.map((a) => (
                <div
                  key={a.name}
                  className="relative bg-cosmos-2 clip-arena-sm p-4"
                  style={{
                    border: a.earned ? "1px solid rgba(155,107,255,0.35)" : "1px solid rgba(45,27,105,0.5)",
                  }}
                >
                  <div
                    className="w-9 h-9 flex items-center justify-center mb-3 clip-arena-sm"
                    style={{
                      background: a.earned ? "rgba(155,107,255,0.14)" : "rgba(45,27,105,0.3)",
                      border: a.earned ? "1px solid rgba(155,107,255,0.4)" : "1px solid rgba(74,63,112,0.5)",
                    }}
                  >
                    {a.earned ? (
                      <Trophy size={16} className="text-void" aria-hidden />
                    ) : (
                      <Lock size={14} className="text-haze-3" aria-hidden />
                    )}
                  </div>
                  <p className={`font-rajdhani font-bold text-sm mb-1 ${a.earned ? "text-haze" : "text-haze-2"}`}>{a.name}</p>
                  <p className="font-rajdhani text-xs text-haze-3 leading-snug">{a.desc}</p>
                  {!a.earned && (
                    <span className="absolute top-3 right-3 font-space-mono text-[8px] text-haze-3 tracking-wider">LOCKED</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* History */}
          <div>
            <h2 className="font-orbitron font-bold text-base text-haze tracking-wide mb-4">RECENT ARENAS</h2>
            <div className="clip-arena overflow-hidden" style={{ border: "1px solid rgba(45,27,105,0.7)" }}>
              {HISTORY.map((h) => {
                const catColor = CATEGORY_COLORS[h.category] ?? "#9B8FC0";
                return (
                  <div
                    key={h.name}
                    className="flex items-center gap-3 px-4 md:px-5 py-3.5 bg-cosmos-2 border-b border-cosmos-4 last:border-0 hover:bg-cosmos-3 transition-colors"
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: catColor }} aria-hidden />
                    <div className="flex-1 min-w-0">
                      <p className="font-rajdhani font-bold text-sm text-haze truncate">{h.name}</p>
                      <p className="font-space-mono text-[10px] text-haze-3 mt-0.5">
                        <span style={{ color: catColor }}>{h.category}</span> · {h.place} · {h.date}
                      </p>
                    </div>
                    <span className="font-orbitron font-bold text-sm text-crown shrink-0">+{h.coins} ◈</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
