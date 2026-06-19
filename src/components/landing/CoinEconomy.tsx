"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Accent,
  LANDING_STACK,
  LANDING_BUNDLE_GRID,
  LANDING_CARD_GRID_3,
  LANDING_DIVIDER_TOP,
  LANDING_SUBSTACK,
  LANDING_SURFACE,
  LandingSection,
  SectionIntro,
} from "@/components/landing/_section";
import { ENTRY_FEE, ENTRY_FEE_SUMMARY, HOSTING_FREE_SUMMARY } from "@/lib/coins";
import { Trophy, Medal, CheckCircle, Flame, UserPlus, Star } from "lucide-react";

const EARN = [
  { icon: Trophy, label: "Win 1st place", value: "100–500 coins", desc: "Prize scales with room size and bounty tier" },
  { icon: Medal, label: "Place 2nd / 3rd", value: "30–50% / 10–20%", desc: "Offered in rooms with 5+ / 10+ participants" },
  { icon: CheckCircle, label: "Complete a room", value: "+10 coins", desc: "Consolation reward for finishing any room" },
  { icon: Flame, label: "Daily streaks", value: "5/day + 50 bonus", desc: "Earn 5 coins daily. Day 7 streak pays 50 bonus" },
  { icon: UserPlus, label: "Invite referral", value: "+30 coins", desc: "When a friend signs up and plays their first room" },
  { icon: Star, label: "Rank milestones", value: "100–500 coins", desc: "One-time payout upon crossing each rank threshold" },
] as const;

const BUNDLES: {
  label: string;
  coins: number;
  price: string;
  desc: string;
  popular?: boolean;
}[] = [
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
      <div ref={ref} className={`w-full flex flex-col items-center ${LANDING_STACK}`}>
        <SectionIntro
          eyebrow="Coins, not cash"
          title={
            <>
              The Bountixx <Accent>economy.</Accent>
            </>
          }
          description={`${HOSTING_FREE_SUMMARY} ${ENTRY_FEE_SUMMARY}`}
          extra="Coins are non-transferable values inside Bountixx. They drive progression and competitive stake, not cash transactions."
          align="center"
          className="mb-0"
        />

        <div className={`w-full max-w-5xl mx-auto ${LANDING_DIVIDER_TOP} ${LANDING_SUBSTACK}`}>
          <div className="flex flex-col items-center justify-center gap-5 text-center">
            <h3 className="font-zen-dots text-2xl md:text-3xl text-haze">Earning</h3>
            <span className="font-space-mono text-[10px] tracking-[3px] uppercase text-crown">◈ Coins</span>
          </div>

          <motion.div
            initial="hidden"
            animate={inView ? "show" : "hidden"}
            variants={{ show: { transition: { staggerChildren: 0.08 } } }}
            className={LANDING_CARD_GRID_3}
          >
            {EARN.map((row) => {
              const Icon = row.icon;
              return (
                <motion.div
                  key={row.label}
                  variants={{
                    hidden: { opacity: 0, y: 16 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
                  }}
                  className={`${LANDING_SURFACE} landing-copy-stack flex flex-col items-center text-center rounded-2xl border-2`}
                  style={{ background: "var(--cosmos-2)", borderColor: "var(--border-1)" }}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(240,165,0,0.1)", border: "1px solid rgba(240,165,0,0.25)" }}
                  >
                    <Icon size={20} className="text-crown" aria-hidden />
                  </div>
                  <p className="font-space-mono text-base font-bold text-crown">{row.value}</p>
                  <h4 className="font-rajdhani font-semibold text-lg text-haze">{row.label}</h4>
                  <p className="font-rajdhani text-sm md:text-base text-haze-3 leading-[1.8] max-w-[28ch]">{row.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        <div className={`w-full max-w-5xl mx-auto ${LANDING_DIVIDER_TOP} ${LANDING_SUBSTACK}`}>
          <div className="flex flex-col items-center justify-center gap-5 text-center">
            <h3 className="font-zen-dots text-2xl md:text-3xl text-haze">Coin Bundles</h3>
            <span className="font-space-mono text-[9px] tracking-[2px] uppercase text-haze-3">
              Stripe · Paystack
            </span>
          </div>

          <motion.div
            initial="hidden"
            animate={inView ? "show" : "hidden"}
            variants={{ show: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } } }}
            className={LANDING_BUNDLE_GRID}
          >
            {BUNDLES.map((b) => (
              <motion.div
                key={b.label}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
                }}
                className={`${LANDING_SURFACE} landing-copy-stack relative flex flex-col items-center text-center rounded-2xl border-2 w-full max-w-sm mx-auto transition-transform duration-300 hover:-translate-y-1`}
                style={{
                  background: b.popular ? "var(--void-tint)" : "var(--cosmos-2)",
                  borderColor: b.popular ? "var(--border-accent)" : "var(--border-1)",
                }}
              >
                {b.popular && (
                  <span className="absolute -top-px left-1/2 -translate-x-1/2 font-space-mono text-[8px] px-2.5 py-1 tracking-[2px] uppercase whitespace-nowrap bg-crown text-cosmos">
                    Most Popular
                  </span>
                )}
                <p className="font-orbitron font-black text-2xl tabular-nums text-crown">{b.coins.toLocaleString()}</p>
                <p className="font-space-mono text-[9px] text-haze-3 tracking-[2px] uppercase">Coins</p>
                <p className="font-rajdhani text-sm text-haze-3 leading-[1.75] flex-1 px-2">{b.desc}</p>
                <p className="font-zen-dots text-lg text-haze pt-[clamp(1rem,2vw,1.5rem)] border-t border-[var(--border-1)] w-full">{b.price}</p>
                <p className="font-space-mono text-[9px] text-haze-3 tracking-[1px] uppercase pb-1">{b.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </LandingSection>
  );
}
