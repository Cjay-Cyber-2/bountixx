"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Accent, LandingSection, SectionIntro } from "@/components/landing/_section";

const EARN = [
  { label: "Win 1st place", value: "100–500", desc: "Scales with room size and bounty tier" },
  { label: "Place 2nd / 3rd", value: "30–50%", desc: "Available in rooms with 5+ participants" },
  { label: "Complete any room", value: "+10", desc: "Consolation reward for finishing" },
  { label: "Daily streaks", value: "+5/day", desc: "Day 7 streak pays a 50-coin bonus" },
  { label: "Invite a friend", value: "+30", desc: "When they play their first room" },
  { label: "Rank milestones", value: "100–500", desc: "One-time payout per rank threshold" },
] as const;

interface Bundle {
  label: string;
  coins: number;
  price: string;
  popular?: boolean;
}

const BUNDLES: Bundle[] = [
  { label: "Starter", coins: 100, price: "$0.99" },
  { label: "Challenger", coins: 300, price: "$2.49" },
  { label: "Elite", coins: 750, price: "$4.99", popular: true },
  { label: "Champion", coins: 2000, price: "$11.99" },
  { label: "Legendary", coins: 5500, price: "$27.99" },
];

export function CoinEconomy() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });

  return (
    <LandingSection>
      <div ref={ref}>
        <SectionIntro
          eyebrow="Coins, not cash"
          title={
            <>
              The Bountixx <Accent>economy.</Accent>
            </>
          }
          description="Hosting an arena is free. Competing players pay 50 coins when the match starts — the pool goes to the winner."
          extra="Coins are non-transferable in-platform values. They drive progression and competitive stake."
        />

        {/* Earning section */}
        <div className="mb-20 md:mb-24">
          <div className="flex items-center justify-center gap-3 mb-8 md:mb-10 text-center">
            <h3 className="font-zen-dots text-xl md:text-2xl text-haze">Earning</h3>
            <span className="font-space-mono text-[10px] tracking-[3px] uppercase text-coin-gold">◈ Coins</span>
          </div>

          <motion.div
            initial="hidden"
            animate={inView ? "show" : "hidden"}
            variants={{ show: { transition: { staggerChildren: 0.06 } } }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5"
          >
            {EARN.map((row) => (
              <motion.div
                key={row.label}
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
                }}
                className="flex items-start gap-4 p-5 md:p-6"
                style={{ background: "var(--cosmos-2)", border: "1px solid var(--border-1)" }}
              >
                <span className="font-space-mono text-base font-bold tabular-nums text-coin-gold shrink-0 mt-0.5">
                  {row.value}
                </span>
                <div className="min-w-0">
                  <p className="font-rajdhani font-semibold text-[15px] text-haze leading-snug">{row.label}</p>
                  <p className="font-rajdhani text-sm text-haze-3 leading-relaxed mt-0.5">{row.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Bundles section */}
        <div>
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8 md:mb-10 text-center">
            <h3 className="font-zen-dots text-xl md:text-2xl text-haze">Coin Bundles</h3>
            <span className="font-space-mono text-[9px] tracking-[2px] uppercase text-haze-3">
              Stripe · Paystack
            </span>
          </div>

          <motion.div
            initial="hidden"
            animate={inView ? "show" : "hidden"}
            variants={{ show: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } } }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5"
          >
            {BUNDLES.map((b) => (
              <motion.div
                key={b.label}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
                }}
                className="relative flex flex-col items-center text-center gap-3 p-6 md:p-7 transition-transform duration-300 hover:-translate-y-1"
                style={{
                  background: b.popular ? "var(--void-tint)" : "var(--cosmos-2)",
                  border: b.popular ? "1px solid var(--border-accent)" : "1px solid var(--border-1)",
                }}
              >
                {b.popular && (
                  <span
                    className="absolute -top-px left-1/2 -translate-x-1/2 font-space-mono text-[8px] px-2.5 py-1 tracking-[2px] uppercase whitespace-nowrap text-cosmos"
                    style={{ background: "var(--coin-gold-text)" }}
                  >
                    Popular
                  </span>
                )}

                <p className="font-orbitron font-black text-2xl tabular-nums text-coin-gold">
                  {b.coins.toLocaleString()}
                </p>
                <p className="font-space-mono text-[9px] text-haze-3 tracking-[2px] uppercase">Coins</p>

                <div className="pt-3 mt-auto" style={{ borderTop: "1px solid var(--border-1)" }}>
                  <p className="font-zen-dots text-lg text-haze">{b.price}</p>
                  <p className="font-space-mono text-[9px] text-haze-3 tracking-[1px] uppercase mt-0.5">{b.label}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </LandingSection>
  );
}
