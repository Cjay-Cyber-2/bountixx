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

export function RankShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });

  return (
    <section
      id="ranks"
      ref={ref}
      className="py-28 md:py-36 px-6 lg:px-14 bg-cosmos-2 border-y border-cosmos-4 overflow-hidden"
    >
      <div className="max-w-[1280px] mx-auto">
        {/* Heading */}
        <div className="mb-16 md:mb-20 max-w-2xl">
          <p className="font-space-mono text-[10px] tracking-[5px] uppercase text-haze-3 mb-5">
            XP · Every room moves the needle
          </p>
          <h2 className="font-zen-dots text-[clamp(2rem,4.5vw,3.5rem)] text-haze leading-[1.05]">
            Rise through{" "}
            <span
              style={{
                background: "linear-gradient(110deg,#a855f7 0%,#c084fc 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              the ranks
            </span>
          </h2>
          <p className="font-rajdhani text-lg text-haze-2 mt-5 leading-relaxed">
            Win, place, or just show up — XP accrues either way. Each rank unlocks bigger bounty tiers and a payout the moment you cross it.
          </p>
        </div>

        {/* Rank table — horizontal rule layout, no colored badges */}
        <motion.div
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          variants={{ show: { transition: { staggerChildren: 0.08 } } }}
          className="border-t border-cosmos-4 divide-y divide-cosmos-4"
        >
          {RANKS.map((rank) => (
            <motion.div
              key={rank.name}
              variants={{
                hidden: { opacity: 0, y: 16 },
                show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
              }}
              className="group grid grid-cols-[auto_1fr_auto_auto] md:grid-cols-[40px_auto_1fr_140px_100px] items-center gap-5 md:gap-8 py-5 hover:bg-cosmos-3 transition-colors duration-200 px-2"
            >
              {/* Index */}
              <span className="font-space-mono text-[10px] text-haze-3 tabular-nums hidden md:block">
                {rank.num}
              </span>

              {/* Rank name */}
              <span className="font-zen-dots text-lg md:text-xl text-haze tracking-wide">
                {rank.name}
              </span>

              {/* Unlock */}
              <span className="font-rajdhani text-[14px] text-haze-3 hidden md:block">
                {rank.unlock}
              </span>

              {/* XP threshold */}
              <span className="font-space-mono text-[11px] text-haze-3 tabular-nums text-right hidden md:block">
                {rank.xp} XP
              </span>

              {/* Reward */}
              <span
                className="font-space-mono text-[13px] tabular-nums text-right"
                style={{ color: rank.reward ? "#F0A500" : "rgba(74,63,112,0.6)" }}
              >
                {rank.reward ? `${rank.reward} ◈` : "—"}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* XP progress demo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.55, duration: 0.55 }}
          className="mt-14 max-w-xl"
          style={{
            background: "rgba(14,8,24,0.5)",
            border: "1px solid rgba(45,27,105,0.7)",
            padding: "28px 32px",
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
