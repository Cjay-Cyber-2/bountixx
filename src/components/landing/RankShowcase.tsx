"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Accent, CenteredSectionIntro, LANDING_SURFACE, LandingSection } from "@/components/landing/_section";

const RANKS = [
  { num: "01", name: "RECRUIT", xp: "0", reward: null, unlock: "Standard rooms", height: 18 },
  { num: "02", name: "CHALLENGER", xp: "500", reward: "+100", unlock: "Silver bounty rooms", height: 34 },
  { num: "03", name: "ELITE", xp: "2,000", reward: "+250", unlock: "Gold rooms · profile badge", height: 52 },
  { num: "04", name: "CHAMPION", xp: "7,500", reward: "+500", unlock: "Mythic rooms · avatar frame", height: 72 },
  { num: "05", name: "LEGENDARY", xp: "20,000", reward: "+1,500", unlock: "Legendary badge · exclusive sticker", height: 100 },
] as const;

function rankOpacity(i: number) {
  return 0.35 + i * 0.15;
}

export function RankShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduce = useReducedMotion();

  return (
    <LandingSection id="ranks" variant="raised">
      <div ref={ref} className="w-full">
        <CenteredSectionIntro
          eyebrow="5 ranks, 20,000 XP ceiling"
          title={
            <>
              Rise through <Accent>the ranks.</Accent>
            </>
          }
          description="Win, place, or just finish — XP accrues either way. Each rank unlocks bigger bounty tiers and a one-time coin payout the moment you cross it."
        />

        <div className="hidden md:grid grid-cols-5 gap-6 lg:gap-8 items-end" style={{ minHeight: 460 }}>
          {RANKS.map((rank, i) => (
            <motion.div
              key={rank.name}
              initial={reduce ? false : { opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col justify-end"
            >
              <div className="px-5 lg:px-6 pb-8 md:pb-10 text-center">
                <p className="font-zen-dots text-base lg:text-lg mb-4 tracking-wide text-void" style={{ opacity: rankOpacity(i) }}>
                  {rank.name}
                </p>
                <p className="font-rajdhani text-[13px] text-haze-3 leading-[1.75] mb-5 min-h-[3em] px-2">
                  {rank.unlock}
                </p>
                <p className="font-space-mono text-[11px] text-haze-2 tabular-nums">{rank.xp} XP</p>
                <p
                  className="font-space-mono text-[12px] tabular-nums mt-2"
                  style={{ color: rank.reward ? "var(--crown)" : "var(--border-2)" }}
                >
                  {rank.reward ? `${rank.reward} ◈` : "\u00a0"}
                </p>
              </div>

              <motion.div
                initial={reduce ? false : { scaleY: 0 }}
                animate={inView ? { scaleY: 1 } : {}}
                transition={{ duration: 0.7, delay: 0.2 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                className="origin-bottom w-full relative"
                style={{
                  height: `${rank.height * 2.6}px`,
                  background: `linear-gradient(180deg, rgba(168,85,247,${0.08 + i * 0.04}) 0%, transparent 100%)`,
                  borderTop: `2px solid rgba(168,85,247,${0.35 + i * 0.12})`,
                }}
              >
                <span
                  className="absolute top-4 left-5 font-orbitron font-black text-[11px] tabular-nums text-void"
                  style={{ opacity: 0.5 + i * 0.1 }}
                >
                  {rank.num}
                </span>
              </motion.div>
            </motion.div>
          ))}
        </div>

        <div className="md:hidden flex flex-col gap-8">
          {[...RANKS].reverse().map((rank) => (
            <div
              key={rank.name}
              className={`${LANDING_SURFACE} rounded-2xl border-2 text-center`}
              style={{
                background: "var(--cosmos-2)",
                borderColor: "var(--border-1)",
                borderLeft: "3px solid rgba(168,85,247,0.45)",
              }}
            >
              <div className="flex items-baseline justify-between mb-4 gap-4">
                <span className="font-zen-dots text-base text-void">{rank.name}</span>
                <span className="font-space-mono text-[11px] text-haze-2 tabular-nums">{rank.xp} XP</span>
              </div>
              <div className="flex items-baseline justify-between gap-4 pt-2">
                <p className="font-rajdhani text-[13px] text-haze-3 leading-[1.75] text-left">{rank.unlock}</p>
                <span
                  className="font-space-mono text-[12px] tabular-nums shrink-0"
                  style={{ color: rank.reward ? "var(--crown)" : "var(--border-2)" }}
                >
                  {rank.reward ? `${rank.reward} ◈` : ""}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </LandingSection>
  );
}
