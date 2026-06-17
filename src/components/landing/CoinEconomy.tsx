"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Accent, LandingSection, SectionIntro } from "@/components/landing/_section";

const EARN = [
  { label: "Win 1st place", value: "100-500", unit: "coins", desc: "Prize scales with room size and bounty tier" },
  { label: "Place 2nd / 3rd", value: "30-50% / 10-20%", unit: "", desc: "Offered in rooms with 5+ / 10+ participants" },
  { label: "Complete a room", value: "+10", unit: "coins", desc: "Consolation reward for finishing any room" },
  { label: "Daily streaks", value: "5/day", unit: "+ 50 bonus", desc: "Earn 5 coins daily. Day 7 streak pays 50 bonus" },
  { label: "Invite referral", value: "+30", unit: "coins", desc: "When a friend signs up and plays their first room" },
  { label: "Rank milestones", value: "100-500", unit: "coins", desc: "One-time payout upon crossing each rank threshold" },
] as const;

interface Bundle {
  label: string;
  coins: number;
  price: string;
  desc: string;
  popular?: boolean;
}

const BUNDLES: Bundle[] = [
  { label: "Starter", coins: 100, price: "$0.99", desc: "Testing the waters" },
  { label: "Challenger", coins: 300, price: "$2.49", desc: "Standard for regular players" },
  { label: "Elite", coins: 750, price: "$4.99", desc: "Best for active room hosts", popular: true },
  { label: "Champion", coins: 2000, price: "$11.99", desc: "Power users value tier" },
  { label: "Legendary", coins: 5500, price: "$27.99", desc: "Top tier for community hosts" },
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
          description="Hosting an arena is free. Each competing player pays 50 coins when the match starts — that pool goes to the winner."
          extra="Coins are non-transferable values inside Bountixx. They drive progression and competitive stake, not cash transactions."
        />

        <div className="mb-20 md:mb-28 lg:mb-32">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8 md:mb-10 text-center">
            <h3 className="font-zen-dots text-2xl md:text-3xl text-haze">Earning</h3>
            <span className="font-space-mono text-[10px] tracking-[3px] uppercase text-crown">◈ Coins</span>
          </div>

          <motion.div
            initial="hidden"
            animate={inView ? "show" : "hidden"}
            variants={{ show: { transition: { staggerChildren: 0.06 } } }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px"
            style={{ background: "var(--border-1)", border: "1px solid var(--border-1)" }}
          >
            {EARN.map((row) => (
              <motion.div
                key={row.label}
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
                }}
                className="p-7 md:p-9 flex flex-col gap-2 text-center items-center"
                style={{ background: "var(--cosmos)" }}
              >
                <p className="font-space-mono text-lg font-bold tabular-nums text-crown">
                  {row.value}
                  {row.unit && (
                    <span className="text-[11px] font-normal text-haze-3 ml-2">{row.unit}</span>
                  )}
                </p>
                <h4 className="font-rajdhani font-semibold text-[17px] text-haze">{row.label}</h4>
                <p className="font-rajdhani text-sm text-haze-3 leading-relaxed max-w-[40ch]">{row.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <div>
          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 mb-8 md:mb-10 text-center">
            <h3 className="font-zen-dots text-2xl md:text-3xl text-haze">Coin Bundles</h3>
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
                className="relative flex flex-col items-center text-center gap-4 p-6 md:p-7 transition-transform duration-300 hover:-translate-y-1"
                style={{
                  background: b.popular ? "var(--void-tint)" : "var(--cosmos-2)",
                  border: b.popular ? "1px solid var(--border-accent)" : "1px solid var(--border-1)",
                }}
              >
                {b.popular && (
                  <span
                    className="absolute -top-px left-1/2 -translate-x-1/2 font-space-mono text-[8px] px-2.5 py-1 tracking-[2px] uppercase whitespace-nowrap bg-crown text-cosmos"
                  >
                    Most Popular
                  </span>
                )}

                <div>
                  <p className="font-orbitron font-black text-3xl tabular-nums text-crown">
                    {b.coins.toLocaleString()}
                  </p>
                  <p className="font-space-mono text-[9px] text-haze-3 tracking-[2px] uppercase mt-1">Coins</p>
                </div>

                <p className="font-rajdhani text-sm text-haze-3 leading-snug flex-1">{b.desc}</p>

                <div className="pt-4" style={{ borderTop: "1px solid var(--border-1)" }}>
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
