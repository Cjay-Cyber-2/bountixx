"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { XPBar } from "@/components/ui/XPBar";

const RANKS = [
  { num: "01", name: "RECRUIT",    xp: "0",      reward: null,     unlock: "Standard rooms",                    height: 18 },
  { num: "02", name: "CHALLENGER", xp: "500",    reward: "+100",   unlock: "Silver bounty rooms",               height: 34 },
  { num: "03", name: "ELITE",      xp: "2,000",  reward: "+250",   unlock: "Gold rooms · profile badge",        height: 52 },
  { num: "04", name: "CHAMPION",   xp: "7,500",  reward: "+500",   unlock: "Mythic rooms · avatar frame",       height: 72 },
  { num: "05", name: "LEGENDARY",  xp: "20,000", reward: "+1,500", unlock: "Legendary badge · exclusive sticker", height: 100 },
] as const;

const RANK_ACCENT: Record<string, string> = {
  RECRUIT: "var(--haze-3)",
  CHALLENGER: "#a855f7",
  ELITE: "#00D68F",
  CHAMPION: "#F0A500",
  LEGENDARY: "#FF6B1A",
};

export function RankShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduce = useReducedMotion();

  return (
    <section
      id="ranks"
      ref={ref}
      className="py-28 md:py-40 px-6 lg:px-14 overflow-hidden"
      style={{
        background: "var(--cosmos-2)",
        borderTop: "1px solid var(--border-1)",
        borderBottom: "1px solid var(--border-1)",
      }}
    >
      <div className="max-w-[1280px] mx-auto">
        <div className="mb-16 md:mb-24 max-w-2xl">
          <h2 className="font-zen-dots text-[clamp(2rem,4.5vw,3.5rem)] text-haze leading-[1.05] text-balance">
            Rise through{" "}
            <span style={{ color: "var(--void)" }}>the ranks.</span>
          </h2>
          <p className="font-rajdhani text-lg text-haze-2 mt-5 max-w-xl leading-relaxed">
            Win, place, or just finish. XP accrues either way. Each rank unlocks bigger bounty tiers and a one-time coin payout the moment you cross it.
          </p>
          <p className="font-space-mono text-[10px] text-haze-3 tracking-[3px] uppercase mt-6">
            5 ranks · 20,000 XP ceiling
          </p>
        </div>

        {/* The staircase: each rank a step taller than the last */}
        <div className="hidden md:grid grid-cols-5 gap-px items-end mb-20" style={{ minHeight: 420 }}>
          {RANKS.map((rank, i) => {
            const accent = RANK_ACCENT[rank.name] ?? "var(--haze-3)";
            return (
              <motion.div
                key={rank.name}
                initial={reduce ? false : { opacity: 0, y: 40 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col justify-end"
              >
                {/* Rank meta above the step */}
                <div className="px-4 pb-5">
                  <p className="font-zen-dots text-base lg:text-lg mb-2 tracking-wide" style={{ color: accent }}>
                    {rank.name}
                  </p>
                  <p className="font-rajdhani text-[13px] text-haze-3 leading-snug mb-3 min-h-[2.6em]">
                    {rank.unlock}
                  </p>
                  <p className="font-space-mono text-[11px] text-haze-2 tabular-nums">{rank.xp} XP</p>
                  <p className="font-space-mono text-[12px] tabular-nums mt-1" style={{ color: rank.reward ? "#F0A500" : "var(--border-2)" }}>
                    {rank.reward ? `${rank.reward} ◈` : " "}
                  </p>
                </div>

                {/* The step itself */}
                <motion.div
                  initial={reduce ? false : { scaleY: 0 }}
                  animate={inView ? { scaleY: 1 } : {}}
                  transition={{ duration: 0.7, delay: 0.2 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                  className="origin-bottom w-full relative"
                  style={{
                    height: `${rank.height * 2.6}px`,
                    background: `linear-gradient(180deg, ${accent === "var(--haze-3)" ? "rgba(155,143,192,0.10)" : `${RANK_ACCENT[rank.name]}1F`} 0%, transparent 100%)`,
                    borderTop: `2px solid ${accent}`,
                  }}
                >
                  <span className="absolute top-3 left-4 font-orbitron font-black text-[11px] tabular-nums" style={{ color: accent, opacity: 0.7 }}>
                    {rank.num}
                  </span>
                </motion.div>
              </motion.div>
            );
          })}
        </div>

        {/* Mobile: vertical ladder, top rank first */}
        <div className="md:hidden flex flex-col gap-px mb-16" style={{ background: "var(--border-1)", border: "1px solid var(--border-1)" }}>
          {[...RANKS].reverse().map((rank) => {
            const accent = RANK_ACCENT[rank.name] ?? "var(--haze-3)";
            return (
              <div key={rank.name} className="p-5" style={{ background: "var(--cosmos-2)", borderLeft: `2px solid ${accent}` }}>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="font-zen-dots text-base" style={{ color: accent }}>{rank.name}</span>
                  <span className="font-space-mono text-[11px] text-haze-2 tabular-nums">{rank.xp} XP</span>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-rajdhani text-[13px] text-haze-3">{rank.unlock}</p>
                  <span className="font-space-mono text-[12px] tabular-nums shrink-0" style={{ color: rank.reward ? "#F0A500" : "var(--border-2)" }}>
                    {rank.reward ? `${rank.reward} ◈` : ""}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* XP progress demo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.7, duration: 0.55 }}
          className="max-w-xl p-7 md:p-8 rounded-sm"
          style={{
            background: "var(--surface-card)",
            border: "1px solid var(--border-1)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="font-zen-dots text-sm text-haze tracking-wide">CHAMPION</span>
            <span className="font-space-mono text-[11px] text-haze-3">13,180 / 20,000 XP</span>
          </div>
          <XPBar current={13180} max={20000} thick color="void" />
          <p className="font-space-mono text-[10px] text-haze-3 mt-3 tracking-[1px]">
            6,820 XP to Legendary, the final rank.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
