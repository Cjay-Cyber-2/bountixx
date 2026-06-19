"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { XPBar } from "@/components/ui/XPBar";
import { Accent, LandingSection, SectionIntro } from "@/components/landing/_section";

const RANKS = [
  { name: "RECRUIT", xp: "0", reward: null, unlock: "Standard rooms" },
  { name: "CHALLENGER", xp: "500", reward: "+100", unlock: "Silver bounty rooms" },
  { name: "ELITE", xp: "2,000", reward: "+250", unlock: "Gold rooms · profile badge" },
  { name: "CHAMPION", xp: "7,500", reward: "+500", unlock: "Mythic rooms · avatar frame" },
  { name: "LEGENDARY", xp: "20,000", reward: "+1,500", unlock: "Legendary badge · exclusive sticker" },
] as const;

/** Purple ramp for ranks — gold reserved for coin payouts only. */
function rankOpacity(i: number) {
  return 0.35 + i * 0.15;
}

export function RankShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduce = useReducedMotion();

  return (
    <LandingSection id="ranks" variant="raised">
      <div ref={ref}>
        <SectionIntro
          eyebrow="5 ranks, 20K XP ceiling"
          title={
            <>
              Rise through <Accent>the ranks.</Accent>
            </>
          }
          description="Win, place, or just finish — XP accrues either way. Each rank unlocks bigger bounties and a one-time coin payout."
        />

        {/* Rank list — clean horizontal cards */}
        <motion.div
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          variants={{ show: { transition: { staggerChildren: 0.08 } } }}
          className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-5 mb-14 md:mb-18"
        >
          {RANKS.map((rank, i) => (
            <motion.div
              key={rank.name}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
              }}
              className="relative p-5 md:p-6 flex flex-col gap-3 transition-transform duration-300 hover:-translate-y-1"
              style={{
                background: "var(--cosmos)",
                border: "1px solid var(--border-1)",
                borderTop: `2px solid rgba(168,85,247,${0.35 + i * 0.12})`,
              }}
            >
              <p
                className="font-zen-dots text-sm tracking-wide text-void"
                style={{ opacity: rankOpacity(i) }}
              >
                {rank.name}
              </p>
              <p className="font-space-mono text-[11px] text-haze-2 tabular-nums">{rank.xp} XP</p>
              <p className="font-rajdhani text-[13px] text-haze-3 leading-snug flex-1">{rank.unlock}</p>
              <p
                className="font-space-mono text-[12px] tabular-nums mt-auto"
                style={{ color: rank.reward ? "var(--coin-gold-text)" : "var(--border-2)" }}
              >
                {rank.reward ? `${rank.reward} ◈` : "\u00a0"}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* XP bar demo */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5, duration: 0.55 }}
          className="max-w-xl mx-auto p-7 md:p-9 text-center"
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
            6,820 XP to Legendary — the final rank.
          </p>
        </motion.div>
      </div>
    </LandingSection>
  );
}
