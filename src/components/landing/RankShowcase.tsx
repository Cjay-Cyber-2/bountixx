"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { XPBar } from "@/components/ui/XPBar";

const RANKS = [
  { num: "01", name: "RECRUIT",    xp: "0",      reward: null,     unlock: "Standard rooms" },
  { num: "02", name: "CHALLENGER", xp: "500",    reward: "+100",   unlock: "Silver bounty rooms" },
  { num: "03", name: "ELITE",      xp: "2,000",  reward: "+250",   unlock: "Gold rooms · profile badge" },
  { num: "04", name: "CHAMPION",   xp: "7,500",  reward: "+500",   unlock: "Mythic rooms · avatar frame" },
  { num: "05", name: "LEGENDARY",  xp: "20,000", reward: "+1,500", unlock: "Legendary badge · exclusive sticker" },
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

  return (
    <section
      id="ranks"
      ref={ref}
      className="py-28 md:py-36 px-6 lg:px-14 overflow-hidden"
      style={{
        background: "var(--cosmos-2)",
        borderTop: "1px solid var(--border-1)",
        borderBottom: "1px solid var(--border-1)",
      }}
    >
      <div className="max-w-[1280px] mx-auto">
        <div className="grid lg:grid-cols-[1fr_auto] gap-12 lg:gap-20 items-end mb-16 md:mb-20">
          <div>
            <h2 className="font-zen-dots text-[clamp(2rem,4.5vw,3.5rem)] text-haze leading-[1.05]">
              Rise through{" "}
              <span style={{ color: "var(--void)" }}>the ranks.</span>
            </h2>
            <p className="font-rajdhani text-lg text-haze-2 mt-5 max-w-xl leading-relaxed">
              Win, place, or just finish — XP accrues either way. Each rank unlocks bigger bounty tiers and a one-time coin payout the moment you cross it.
            </p>
          </div>
          <div className="hidden lg:block">
            <p className="font-space-mono text-[10px] text-haze-3 tracking-[3px] uppercase text-right">
              5 ranks · 20,000 XP ceiling
            </p>
          </div>
        </div>

        {/* Rank table */}
        <motion.div
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          variants={{ show: { transition: { staggerChildren: 0.07 } } }}
          className="mb-14"
          style={{ borderTop: "1px solid var(--border-1)" }}
        >
          {RANKS.map((rank) => {
            const accent = RANK_ACCENT[rank.name] ?? "var(--haze-3)";
            return (
              <motion.div
                key={rank.name}
                variants={{
                  hidden: { opacity: 0, y: 14 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
                }}
                className="group grid grid-cols-[auto_1fr_auto] md:grid-cols-[36px_180px_1fr_140px_100px] items-center gap-5 md:gap-8 py-5 px-3 transition-colors duration-200 rounded-sm"
                style={{
                  borderBottom: "1px solid var(--border-1)",
                  ["--hover-bg" as string]: "var(--surface-hover)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span className="font-space-mono text-[10px] text-haze-3 tabular-nums hidden md:block">
                  {rank.num}
                </span>
                <span
                  className="font-zen-dots text-lg md:text-xl tracking-wide"
                  style={{ color: accent }}
                >
                  {rank.name}
                </span>
                <span className="font-rajdhani text-[14px] text-haze-3 hidden md:block">
                  {rank.unlock}
                </span>
                <span className="font-space-mono text-[11px] text-haze-3 tabular-nums text-right hidden md:block">
                  {rank.xp} XP
                </span>
                <span
                  className="font-space-mono text-[13px] tabular-nums text-right"
                  style={{ color: rank.reward ? "#F0A500" : "var(--border-1)" }}
                >
                  {rank.reward ? `${rank.reward} ◈` : "—"}
                </span>
              </motion.div>
            );
          })}
        </motion.div>

        {/* XP progress demo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5, duration: 0.55 }}
          className="max-w-xl p-7 md:p-8 rounded-sm"
          style={{
            background: "var(--surface-card)",
            border: "1px solid var(--border-1)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="font-zen-dots text-sm text-haze tracking-wide">CHAMPION</span>
            <span className="font-space-mono text-[11px] text-haze-3">6,820 / 10,000 XP</span>
          </div>
          <XPBar current={6820} max={10000} thick color="void" />
          <p className="font-space-mono text-[10px] text-haze-3 mt-3 tracking-[1px]">
            3,180 XP to Legendary — about 16 wins away.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
