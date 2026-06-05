"use client";

import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { XPBar } from "@/components/ui/XPBar";
import { staggerContainer, slideUp } from "@/lib/animations";

const STATS = [
  { label: "ARENAS PLAYED", value: 124 },
  { label: "ARENAS WON",    value: 58  },
  { label: "WIN RATE",      value: 47, suffix: "%" },
  { label: "TOTAL XP",      value: 6820 },
];

const ACHIEVEMENTS = [
  { name: "First Blood",   desc: "Win your first arena",            earned: true  },
  { name: "Hat Trick",     desc: "Win 3 arenas in a row",           earned: true  },
  { name: "Perfectionist", desc: "Pass 20/20 hidden tests",         earned: true  },
  { name: "Speed Demon",   desc: "Submit in under 60 seconds",      earned: false },
  { name: "Veteran",       desc: "Complete 100 arenas",             earned: true  },
  { name: "Legend",        desc: "Reach Legendary rank",            earned: false },
];

const HISTORY = [
  { name: "String Reversal Clash", category: "Coding", place: "1st", coins: 300, date: "Jun 4, 2025" },
  { name: "Capital Cities Rush",   category: "Trivia", place: "2nd", coins: 150, date: "Jun 3, 2025" },
  { name: "Regex Warfare",         category: "Coding", place: "1st", coins: 300, date: "Jun 2, 2025" },
];

export default function ProfilePage() {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-6 lg:px-10 py-0">
        {/* Banner */}
        <div
          className="relative h-48 border-b border-cosmos-4 mb-0 overflow-hidden"
          style={{
            background: "repeating-linear-gradient(135deg, rgba(45,27,105,0.3) 0px, rgba(45,27,105,0.3) 1px, transparent 1px, transparent 20px)",
          }}
        >
          <div className="absolute inset-0 bg-cosmos-2" style={{ opacity: 0.85 }} />
          {/* User info */}
          <div className="absolute bottom-6 left-6 flex items-end gap-4">
            <div className="w-20 h-20 rounded-full bg-cosmos-3 border-[3px] border-void flex items-center justify-center">
              <span className="font-orbitron font-bold text-2xl text-void">AP</span>
            </div>
            <div>
              <h1 className="font-zen-dots text-2xl text-haze">@arena_player</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="font-space-mono text-xs text-haze-3">JOINED JAN 2025</span>
                <span className="text-void text-xs">·</span>
                <span className="font-space-mono text-xs text-haze-3">124 ARENAS</span>
              </div>
            </div>
          </div>
          {/* Coin balance */}
          <div className="absolute bottom-6 right-6 flex items-center gap-2">
            <span className="font-space-mono text-[9px] text-haze-3 tracking-widest">BALANCE</span>
            <span className="font-orbitron font-bold text-2xl text-crown">450</span>
          </div>
        </div>

        <div className="py-8 flex flex-col gap-10">
          {/* Stat cards */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {STATS.map((s) => (
              <motion.div
                key={s.label}
                variants={slideUp}
                className="bg-cosmos-2 border border-cosmos-4 clip-arena p-5"
              >
                <AnimatedNumber
                  value={s.value}
                  suffix={s.suffix}
                  className="font-orbitron font-bold text-3xl text-void block mb-1"
                  format={!s.suffix}
                />
                <p className="font-space-mono text-[9px] text-haze-3 tracking-[3px] uppercase">
                  {s.label}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* XP progress */}
          <div className="bg-cosmos-2 border border-cosmos-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="font-orbitron font-bold text-sm text-haze">CHAMPION</p>
              <p className="font-space-mono text-xs text-void">6,820 / 10,000 XP to LEGENDARY</p>
            </div>
            <XPBar current={6820} max={10000} thick color="void" />
          </div>

          {/* Achievements */}
          <div>
            <h2 className="font-zen-dots text-lg text-haze mb-5">ACHIEVEMENTS</h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {ACHIEVEMENTS.map((a) => (
                <div
                  key={a.name}
                  className={`bg-cosmos-2 border border-cosmos-4 p-4 transition-opacity ${
                    a.earned ? "opacity-100" : "opacity-25"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-cosmos-3 border border-void/30 flex items-center justify-center mb-3">
                    <span className="text-void text-sm">✦</span>
                  </div>
                  <p className="font-rajdhani font-bold text-sm text-haze mb-1">{a.name}</p>
                  <p className="font-rajdhani text-xs text-haze-2">{a.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Room history */}
          <div>
            <h2 className="font-zen-dots text-lg text-haze mb-5">RECENT ARENAS</h2>
            <div className="bg-cosmos-2 border border-cosmos-4 overflow-hidden">
              {HISTORY.map((h, i) => (
                <div
                  key={h.name}
                  className={`flex items-center gap-5 px-5 py-4 border-b border-cosmos-4 last:border-0 hover:bg-cosmos-3 transition-colors ${
                    i % 2 === 0 ? "" : "bg-cosmos/30"
                  }`}
                >
                  <p className="font-rajdhani font-bold text-sm text-haze flex-1 truncate">{h.name}</p>
                  <span className="font-space-mono text-[10px] text-haze-3">{h.category}</span>
                  <span className="font-space-mono text-[10px] text-success">{h.place}</span>
                  <span className="font-orbitron font-bold text-sm text-crown">+{h.coins}</span>
                  <span className="font-space-mono text-[10px] text-haze-3">{h.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
