"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const EARN = [
  { label: "Win 1st place",   value: "100–500 coins",    desc: "Prize scales with room size and bounty tier" },
  { label: "Place 2nd / 3rd", value: "30–50% / 10–20%",  desc: "Offered in rooms with 5+ / 10+ participants" },
  { label: "Complete a room", value: "+10 coins",         desc: "Consolation reward for finishing any room" },
  { label: "Daily streaks",   value: "5/day + 50 bonus",  desc: "Earn 5 coins daily. Day 7 streak pays 50 bonus" },
  { label: "Invite referral", value: "+30 coins",         desc: "When a friend signs up and plays their first room" },
  { label: "Rank milestones", value: "100–500 coins",     desc: "One-time payout upon crossing each rank threshold" },
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
      className="py-36 md:py-48 px-6 lg:px-14 overflow-hidden"
      style={{
        background: "var(--cosmos-2)",
        borderTop: "1px solid var(--border-1)",
        borderBottom: "1px solid var(--border-1)",
      }}
      ref={ref}
    >
      <div className="max-w-[1280px] mx-auto">
        {/* Header */}
        <div className="mb-24 grid lg:grid-cols-2 gap-12 items-end">
          <div>
            <h2 className="font-zen-dots text-[clamp(2.2rem,5vw,3.8rem)] text-haze leading-[1.08]">
              The Bountixx{" "}
              <span style={{ color: "var(--void)" }}>economy.</span>
            </h2>
          </div>
          <div className="space-y-4 lg:pl-10">
            <p className="font-rajdhani text-lg md:text-xl text-haze-2 leading-relaxed">
              Your first 10 rooms are free. After that, creating standard rooms costs 50 coins. Participating in other players' rooms is free forever.
            </p>
            <p className="font-rajdhani text-[14px] text-haze-3 leading-relaxed">
              Coins are non-transferable values inside Bountixx — they drive progression and competitive stake, not cash transactions.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-20 lg:gap-28">

          {/* Ways to earn */}
          <div>
            <div className="flex items-baseline gap-4 pb-4 mb-0" style={{ borderBottom: "1px solid var(--border-1)" }}>
              <h3 className="font-zen-dots text-lg text-haze">Earning</h3>
              <span className="font-space-mono text-[10px] text-haze-3 tracking-[3px] uppercase">◈ Coins</span>
            </div>

            <div style={{ borderBottom: "1px solid var(--border-1)" }}>
              {EARN.map((row, i) => (
                <motion.div
                  key={row.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.1 + i * 0.055 }}
                  className="py-5 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2"
                  style={{ borderTop: "1px solid var(--border-1)" }}
                >
                  <div>
                    <h4 className="font-rajdhani font-semibold text-[17px] text-haze">{row.label}</h4>
                    <p className="font-rajdhani text-sm text-haze-3">{row.desc}</p>
                  </div>
                  <span className="font-space-mono text-sm font-bold shrink-0" style={{ color: "#F0A500" }}>
                    {row.value}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Coin bundles */}
          <div>
            <div className="flex items-baseline justify-between pb-4" style={{ borderBottom: "1px solid var(--border-1)" }}>
              <h3 className="font-zen-dots text-lg text-haze">Coin Bundles</h3>
              <span className="font-space-mono text-[9px] tracking-[2px] uppercase text-haze-3">
                Stripe · Paystack
              </span>
            </div>

            <div className="mt-0" style={{ borderBottom: "1px solid var(--border-1)" }}>
              {BUNDLES.map((b, i) => (
                <motion.div
                  key={b.label}
                  initial={{ opacity: 0, y: 14 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.15 + i * 0.055 }}
                  className="group relative flex items-center justify-between py-5 px-4 transition-colors duration-200"
                  style={{
                    borderTop: "1px solid var(--border-1)",
                    background: b.popular ? "var(--void-tint)" : "transparent",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = b.popular ? "var(--void-tint-hover)" : "var(--surface-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = b.popular ? "var(--void-tint)" : "transparent")}
                >
                  {b.popular && (
                    <span
                      className="absolute -top-px right-4 font-space-mono text-[8px] px-2 py-0.5 tracking-[2px] uppercase"
                      style={{ background: "#F0A500", color: "#0E0818" }}
                    >
                      Most Popular
                    </span>
                  )}

                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-baseline gap-2">
                      <span className="font-orbitron font-black text-2xl" style={{ color: "#F0A500" }}>
                        {b.coins.toLocaleString()}
                      </span>
                      <span className="font-space-mono text-[9px] text-haze-3 tracking-[2px] uppercase">Coins</span>
                    </div>
                    <p className="font-rajdhani text-sm text-haze-3">{b.desc}</p>
                  </div>

                  <div className="text-right">
                    <p className="font-zen-dots text-xl text-haze">{b.price}</p>
                    <p className="font-space-mono text-[9px] text-haze-3 tracking-[1px] uppercase mt-0.5">{b.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
