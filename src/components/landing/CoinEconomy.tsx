"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const EARN = [
  { label: "Win 1st Place", value: "100–500 coins", desc: "Prize scales with room size and bounty tier" },
  { label: "Place 2nd / 3rd", value: "30–50% / 10–20%", desc: "Offered in rooms with 5+ / 10+ participants respectively" },
  { label: "Complete Room", value: "+10 coins", desc: "Consolation reward for attempting and finishing any room" },
  { label: "Daily Streaks", value: "5/day + 50 bonus", desc: "Earn 5 coins daily. Get 50 bonus coins on Day 7 streak" },
  { label: "Invite Referral", value: "+30 coins", desc: "Earn when a friend signs up and plays their first room" },
  { label: "Rank Milestones", value: "100–500 coins", desc: "One-time milestone coin payout upon crossing ranks" },
] as const;

interface Bundle {
  label: string;
  coins: number;
  price: string;
  desc: string;
  popular?: boolean;
}

const BUNDLES: Bundle[] = [
  { label: "Starter Pack", coins: 100, price: "$0.99", desc: "Perfect for testing the waters" },
  { label: "Challenger Pack", coins: 300, price: "$2.49", desc: "Standard for regular players" },
  { label: "Elite Pack", coins: 750, price: "$4.99", desc: "Best for active room hosts", popular: true },
  { label: "Champion Pack", coins: 2000, price: "$11.99", desc: "Power users value tier" },
  { label: "Legendary Pack", coins: 5500, price: "$27.99", desc: "Top tier package for community hosts" },
];

export function CoinEconomy() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });

  return (
    <section
      className="py-36 md:py-48 px-6 lg:px-14 bg-cosmos-2 border-y border-cosmos-4 overflow-hidden"
      ref={ref}
    >
      <div className="max-w-[1280px] mx-auto">
        {/* Top Header Grid */}
        <div className="mb-24 grid lg:grid-cols-2 gap-12 items-end">
          <div>
            <p className="font-space-mono text-[10px] tracking-[5px] uppercase text-[#a855f7] mb-5">
              Platform Economy
            </p>
            <h2 className="font-zen-dots text-[clamp(2.2rem,5vw,3.8rem)] text-haze leading-[1.08]">
              The Bountixx{" "}
              <span
                style={{
                  background: "linear-gradient(110deg,#a855f7 0%,#c084fc 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                economy
              </span>
            </h2>
          </div>
          <div className="space-y-4 lg:pl-10">
            <p className="font-rajdhani text-lg md:text-xl text-haze-2 leading-relaxed">
              Your first 10 rooms are free. After that, creating standard rooms costs 50 coins. Participating in other players' rooms is free forever.
            </p>
            <p className="font-rajdhani text-[14px] text-haze-3 leading-relaxed">
              Coins live inside Bountixx to drive progression and competitive stake. They are non-transferable database values with no cash-out value.
            </p>
          </div>
        </div>

        {/* Columns Grid: Earn list + Bundle cards */}
        <div className="grid lg:grid-cols-2 gap-20 lg:gap-28">
          
          {/* Left: Ways to Earn */}
          <div>
            <p className="font-space-mono text-[10px] tracking-[4px] uppercase text-haze-3 mb-8 pb-4 border-b border-cosmos-4">
              Earning Mechanisms ◈
            </p>
            
            <div className="divide-y divide-cosmos-4">
              {EARN.map((row, i) => (
                <motion.div
                  key={row.label}
                  initial={{ opacity: 0, x: -12 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.45, delay: 0.1 + i * 0.06 }}
                  className="py-5 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2"
                >
                  <div>
                    <h4 className="font-rajdhani font-semibold text-lg text-haze">{row.label}</h4>
                    <p className="font-rajdhani text-sm text-haze-3">{row.desc}</p>
                  </div>
                  <span
                    className="font-space-mono text-sm font-bold text-right shrink-0"
                    style={{ color: "#F0A500" }}
                  >
                    {row.value}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right: Coin bundles list */}
          <div>
            <div className="flex items-end justify-between mb-8 pb-4 border-b border-cosmos-4">
              <p className="font-space-mono text-[10px] tracking-[4px] uppercase text-haze-3">
                Coin Bundles
              </p>
              <p className="font-space-mono text-[9px] tracking-[2px] uppercase text-haze-3">
                stripe / paystack webhooks
              </p>
            </div>

            <div className="space-y-4">
              {BUNDLES.map((b, i) => (
                <motion.div
                  key={b.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.45, delay: 0.15 + i * 0.06 }}
                  className="group relative flex items-center justify-between p-6 hover:bg-cosmos transition-all duration-300 rounded border"
                  style={{
                    borderColor: b.popular ? "rgba(240,165,0,0.3)" : "rgba(45,27,105,0.6)",
                    background: b.popular ? "rgba(240,165,0,0.03)" : "rgba(19,12,36,0.3)",
                  }}
                >
                  {b.popular && (
                    <span
                      className="absolute -top-2.5 left-6 font-space-mono text-[8px] px-2 py-0.5 tracking-[2px] uppercase"
                      style={{ background: "#F0A500", color: "#0E0818" }}
                    >
                      Most Popular
                    </span>
                  )}

                  <div className="flex flex-col gap-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-space-mono text-2xl font-black text-[#F0A500]">
                        {b.coins.toLocaleString()}
                      </span>
                      <span className="font-space-mono text-[9px] text-haze-3 tracking-[2px] uppercase">
                        Coins
                      </span>
                    </div>
                    <p className="font-rajdhani text-sm text-haze-3">{b.desc}</p>
                  </div>

                  <div className="text-right">
                    <p className="font-zen-dots text-xl text-haze">{b.price}</p>
                    <p className="font-space-mono text-[9px] text-haze-3 tracking-[1px] uppercase mt-0.5">
                      {b.label}
                    </p>
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
