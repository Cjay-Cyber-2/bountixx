"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const EARN = [
  { label: "Win 1st place",   value: "100-500",          unit: "coins", desc: "Prize scales with room size and bounty tier" },
  { label: "Place 2nd / 3rd", value: "30-50% / 10-20%",  unit: "",      desc: "Offered in rooms with 5+ / 10+ participants" },
  { label: "Complete a room", value: "+10",              unit: "coins", desc: "Consolation reward for finishing any room" },
  { label: "Daily streaks",   value: "5/day",            unit: "+ 50 bonus", desc: "Earn 5 coins daily. Day 7 streak pays 50 bonus" },
  { label: "Invite referral", value: "+30",              unit: "coins", desc: "When a friend signs up and plays their first room" },
  { label: "Rank milestones", value: "100-500",          unit: "coins", desc: "One-time payout upon crossing each rank threshold" },
] as const;

interface Bundle {
  label: string;
  coins: number;
  price: string;
  desc: string;
  popular?: boolean;
}

const BUNDLES: Bundle[] = [
  { label: "Starter",    coins: 100,   price: "$0.99",  desc: "Testing the waters" },
  { label: "Challenger", coins: 300,   price: "$2.49",  desc: "Standard for regular players" },
  { label: "Elite",      coins: 750,   price: "$4.99",  desc: "Best for active room hosts", popular: true },
  { label: "Champion",   coins: 2000,  price: "$11.99", desc: "Power users value tier" },
  { label: "Legendary",  coins: 5500,  price: "$27.99", desc: "Top tier for community hosts" },
];

export function CoinEconomy() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });

  return (
    <section
      className="cyber-grid relative py-28 md:py-44 px-6 sm:px-10 lg:px-16 overflow-hidden bg-cosmos"
      ref={ref}
    >
      <div className="max-w-6xl mx-auto relative">
        {/* Header */}
        <div className="mb-20 md:mb-28 max-w-2xl">
          <p className="font-space-mono text-[11px] tracking-[5px] uppercase mb-5 flex items-center gap-3" style={{ color: "var(--cyber)" }}>
            <span className="h-px w-8" style={{ background: "var(--cyber)", opacity: 0.6 }} aria-hidden />
            Coins, not cash
          </p>
          <h2 className="font-zen-dots text-[clamp(2.2rem,5vw,3.8rem)] text-haze leading-[1.16]">
            The Bountixx{" "}
            <span style={{ color: "var(--void)" }}>economy.</span>
          </h2>
          <p className="font-rajdhani text-lg md:text-xl text-haze-2 leading-relaxed mt-6">
            Your first 10 rooms are free. After that, creating a standard room costs
            50 coins. Joining other players&apos; rooms is free, forever.
          </p>
          <p className="font-rajdhani text-[15px] text-haze-3 leading-relaxed mt-4 max-w-[60ch]">
            Coins are non-transferable values inside Bountixx. They drive
            progression and competitive stake, not cash transactions.
          </p>
        </div>

        {/* Ways to earn: stat grid */}
        <div className="mb-24 md:mb-32">
          <div className="flex items-baseline gap-4 mb-8">
            <h3 className="font-zen-dots text-2xl md:text-3xl text-haze">Earning</h3>
            <span className="font-space-mono text-[10px] tracking-[3px] uppercase" style={{ color: "#F0A500" }}>◈ Coins</span>
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
                className="p-7 md:p-8 flex flex-col gap-1.5"
                style={{ background: "var(--cosmos)" }}
              >
                <p className="font-space-mono text-lg font-bold tabular-nums" style={{ color: "#F0A500" }}>
                  {row.value}
                  {row.unit && <span className="text-[11px] font-normal text-haze-3 ml-2">{row.unit}</span>}
                </p>
                <h4 className="font-rajdhani font-semibold text-[17px] text-haze">{row.label}</h4>
                <p className="font-rajdhani text-sm text-haze-3 leading-relaxed">{row.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Coin bundles: pricing strip */}
        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-3 mb-8">
            <h3 className="font-zen-dots text-2xl md:text-3xl text-haze">Coin Bundles</h3>
            <span className="font-space-mono text-[9px] tracking-[2px] uppercase text-haze-3">
              Stripe · Paystack
            </span>
          </div>

          <motion.div
            initial="hidden"
            animate={inView ? "show" : "hidden"}
            variants={{ show: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } } }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3"
          >
            {BUNDLES.map((b) => (
              <motion.div
                key={b.label}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
                }}
                className="relative flex flex-col gap-4 p-6 transition-transform duration-300 hover:-translate-y-1"
                style={{
                  background: b.popular ? "var(--void-tint)" : "var(--cosmos-2)",
                  border: b.popular ? "1px solid var(--border-accent)" : "1px solid var(--border-1)",
                }}
              >
                {b.popular && (
                  <span
                    className="absolute -top-px left-1/2 -translate-x-1/2 font-space-mono text-[8px] px-2.5 py-1 tracking-[2px] uppercase whitespace-nowrap"
                    style={{ background: "#F0A500", color: "#0E0818" }}
                  >
                    Most Popular
                  </span>
                )}

                <div>
                  <p className="font-orbitron font-black text-3xl tabular-nums" style={{ color: "#F0A500" }}>
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
    </section>
  );
}
