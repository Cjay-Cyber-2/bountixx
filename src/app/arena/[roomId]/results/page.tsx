"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { XPBar } from "@/components/ui/XPBar";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { winnerReveal, staggerContainer, slideUp } from "@/lib/animations";
import { BountixxWordmark } from "@/components/BountixxLogo";

const LEADERBOARD = [
  { rank: 1, name: "zainab_codes", initials: "ZC", badge: "ELITE",     detail: "Passed 20/20 tests", time: "1:42", coins: 300, xp: 200 },
  { rank: 2, name: "arena_player", initials: "AP", badge: "CHALLENGER", detail: "Passed 20/20 tests", time: "2:15", coins: 150, xp: 100 },
  { rank: 3, name: "dev_tolu",     initials: "DT", badge: "CHAMPION",   detail: "Passed 18/20 tests", time: "2:58", coins: 75,  xp: 60  },
  { rank: 4, name: "code_chief",   initials: "CC", badge: "ELITE",     detail: "Passed 14/20 tests", time: "—",    coins: 0,   xp: 20  },
];

function Confetti() {
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: ["#FF6B1A", "#F0A500", "#9B6BFF", "#FFFFFF", "#00D68F"][i % 5],
    delay: Math.random() * 1.5,
    duration: 2 + Math.random() * 2,
    size: 3 + Math.random() * 6,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.x}%`,
            top: "-20px",
            width: p.size,
            height: p.size,
            background: p.color,
          }}
          initial={{ y: -20, rotate: 0, opacity: 1 }}
          animate={{ y: "110vh", rotate: 720, opacity: [1, 1, 0] }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
        />
      ))}
    </div>
  );
}

export default function ResultsPage() {
  const [showRankUp, setShowRankUp] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowRankUp(true), 3500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-cosmos py-16 px-6 relative overflow-hidden">
      <Confetti />

      {/* Scan lines */}
      <div className="absolute inset-0 scanline-fx pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center gap-10">
        {/* Logo */}
        <BountixxWordmark size={18} />

        {/* Winner card */}
        <motion.div
          variants={winnerReveal}
          initial="hidden"
          animate="show"
          className="w-full bg-cosmos-2 border border-cosmos-4 clip-arena p-8 flex flex-col items-center gap-4 text-center glow-crown"
        >
          <Crown size={56} className="text-crown" aria-hidden="true" />

          <motion.p
            className="font-orbitron font-black text-sm text-crown tracking-[8px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            {["W","I","N","N","E","R"].map((c, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + i * 0.08 }}
              >
                {c}
              </motion.span>
            ))}
          </motion.p>

          <motion.h1
            className="font-orbitron font-bold text-4xl text-haze"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.5, type: "spring", damping: 14 }}
          >
            @zainab_codes
          </motion.h1>

          <p className="font-share-mono text-xs text-haze-2">Solved in 1:42</p>

          {/* Coin reward */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2 }}
            className="flex flex-col items-center gap-1"
          >
            <AnimatedNumber
              value={300}
              prefix="+"
              suffix=" COINS"
              className="font-orbitron font-black text-4xl text-crown"
              duration={1.5}
            />
            <XPBar current={200} max={500} label="+200 XP EARNED" color="void" className="w-40" />
          </motion.div>
        </motion.div>

        {/* Leaderboard */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="w-full flex flex-col gap-2"
        >
          <p className="font-share-mono text-[10px] text-haze-3 tracking-widest mb-2">FINAL STANDINGS</p>
          {LEADERBOARD.map((p) => (
            <motion.div
              key={p.rank}
              variants={slideUp}
              className={`flex items-center gap-4 px-5 py-3.5 border clip-arena-sm ${
                p.rank === 1 ? "border-crown/40 bg-crown/5" :
                p.rank === 2 ? "border-haze-3/30 bg-haze-3/5" :
                p.rank === 3 ? "border-[#CD7F32]/30 bg-[#CD7F32]/5" : "border-cosmos-4 bg-cosmos-2"
              }`}
            >
              <span className={`font-orbitron font-bold text-lg w-6 text-center ${
                p.rank === 1 ? "text-crown" : p.rank === 2 ? "text-haze-2" : p.rank === 3 ? "text-[#CD7F32]" : "text-haze-3"
              }`}>
                {p.rank}
              </span>
              <div className="w-9 h-9 rounded-full bg-cosmos-3 border border-cosmos-4 flex items-center justify-center shrink-0">
                <span className="font-orbitron font-bold text-xs text-haze">{p.initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-rajdhani font-bold text-sm text-haze truncate">@{p.name}</p>
                <p className="font-share-mono text-[9px] text-haze-3">{p.detail}</p>
              </div>
              <span className="font-share-mono text-xs text-haze-3">{p.time}</span>
              <span className="font-orbitron font-bold text-sm text-crown shrink-0">
                {p.coins > 0 ? `+${p.coins}` : "—"}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-wrap justify-center gap-3"
        >
          <Link href="/create"><Button variant="primary" size="md" magnetic>PLAY AGAIN</Button></Link>
          <Button variant="secondary" size="md">VIEW SOLUTIONS</Button>
          <Link href="/dashboard"><p className="font-rajdhani text-sm text-void hover:underline cursor-pointer self-center">Back to Dashboard</p></Link>
        </motion.div>
      </div>

      {/* Rank-up overlay */}
      <AnimatePresence>
        {showRankUp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ignite/20"
          >
            <motion.div
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              transition={{ type: "spring", damping: 12 }}
              className="flex flex-col items-center gap-4 text-center"
              onClick={() => setShowRankUp(false)}
            >
              <p className="font-orbitron font-black text-6xl text-haze glow-ignite">RANK UP!</p>
              <p className="font-orbitron font-bold text-2xl text-crown">YOU ARE NOW: ELITE</p>
              <p className="font-share-mono text-xs text-haze-2 mt-2">Tap anywhere to continue</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
