"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { staggerContainer, slideUp } from "@/lib/animations";

const features = [
  "Win rooms → earn coins",
  "First 10 room creations are FREE",
  "Buy coin bundles from ₦999 / $0.99",
  "Gift coins to friends (Phase 2)",
  "Coins unlock prestige tiers",
];

const bundles = [
  { label: "Starter",    coins: 100,  price: "$0.99",  popular: false },
  { label: "Challenger", coins: 300,  price: "$2.49",  popular: false },
  { label: "Elite",      coins: 750,  price: "$4.99",  popular: true  },
  { label: "Champion",   coins: 2000, price: "$11.99", popular: false },
  { label: "Legendary",  coins: 5500, price: "$27.99", popular: false },
];

function CoinIllustration() {
  return (
    <div className="relative flex items-center justify-center w-48 h-48 mx-auto">
      {/* Outer rotating ring */}
      <svg
        className="absolute inset-0 w-full h-full ring-spin"
        viewBox="0 0 192 192"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="96" cy="96" r="90" stroke="#F0A500" strokeWidth="2" strokeDasharray="12 8" />
      </svg>
      {/* Inner counter-rotating ring */}
      <svg
        className="absolute ring-spin-rev"
        style={{ width: 128, height: 128 }}
        viewBox="0 0 128 128"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="64" cy="64" r="60" stroke="#F0A500" strokeWidth="1" strokeDasharray="6 10" strokeOpacity="0.5" />
      </svg>
      {/* Coin face */}
      <div
        className="relative z-10 w-28 h-28 rounded-full flex items-center justify-center border-4"
        style={{
          background: "radial-gradient(circle at 35% 35%, #FBBF24, #F0A500 60%, #D97706)",
          borderColor: "#F0A500",
          boxShadow: "0 0 40px rgba(240,165,0,0.35), inset 0 2px 8px rgba(255,255,255,0.3)",
        }}
      >
        <span className="font-orbitron font-black text-3xl text-amber-900 select-none bob">
          BX
        </span>
      </div>
      {/* Floating mini coins */}
      {[
        { x: -60, y: -20, delay: 0 },
        { x: 55, y: -30, delay: 0.5 },
        { x: -50, y: 40, delay: 1 },
      ].map((c, i) => (
        <motion.div
          key={i}
          className="absolute w-8 h-8 rounded-full border-2 border-crown/60 flex items-center justify-center"
          style={{
            left: `calc(50% + ${c.x}px)`,
            top: `calc(50% + ${c.y}px)`,
            background: "rgba(240,165,0,0.15)",
          }}
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2 + i * 0.4, repeat: Infinity, delay: c.delay }}
          aria-hidden="true"
        >
          <span className="font-orbitron font-bold text-[8px] text-crown">B</span>
        </motion.div>
      ))}
    </div>
  );
}

export function CoinEconomy() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-8% 0px" });

  return (
    <section className="py-36 px-6 lg:px-14 bg-cosmos-2 border-y border-cosmos-4" ref={ref}>
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center mb-24">
          {/* Left: coin illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <CoinIllustration />
          </motion.div>

          {/* Right: features */}
          <div>
            <p className="font-share-mono text-xs text-ignite tracking-[6px] mb-4 uppercase">
              Economy
            </p>
            <h2 className="font-orbitron font-bold text-4xl lg:text-5xl text-haze mb-12">
              THE BOUNTIXX ECONOMY
            </h2>
            <motion.ul
              variants={staggerContainer}
              initial="hidden"
              animate={inView ? "show" : "hidden"}
              className="flex flex-col gap-4"
            >
              {features.map((feat) => (
                <motion.li
                  key={feat}
                  variants={slideUp}
                  className="flex items-start gap-3 font-rajdhani font-semibold text-lg text-haze"
                >
                  <span className="font-share-mono text-crown text-sm mt-0.5 shrink-0">✦</span>
                  {feat}
                </motion.li>
              ))}
            </motion.ul>
          </div>
        </div>

        {/* Bundle cards */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <p className="font-share-mono text-xs text-haze-3 tracking-widest mb-6 uppercase">
            Coin Bundles
          </p>
          <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
            {bundles.map((b) => (
              <div
                key={b.label}
                className={`relative shrink-0 w-36 bg-cosmos border p-4 clip-arena-sm transition-all hover:-translate-y-1 ${
                  b.popular ? "border-ignite" : "border-cosmos-4 hover:border-ignite/50"
                }`}
                style={b.popular ? { background: "rgba(255,107,26,0.06)" } : {}}
              >
                {b.popular && (
                  <div className="absolute -top-px left-1/2 -translate-x-1/2">
                    <span className="font-share-mono text-[8px] text-cosmos bg-ignite px-2 py-0.5 tracking-widest">
                      POPULAR
                    </span>
                  </div>
                )}
                <p className="font-orbitron font-bold text-2xl text-crown mb-1">
                  {b.coins.toLocaleString()}
                </p>
                <p className="font-share-mono text-[9px] text-haze-3 mb-2">COINS</p>
                <p className="font-rajdhani font-bold text-lg text-haze">{b.price}</p>
                <p className="font-share-mono text-[9px] text-haze-3 mt-0.5">{b.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
