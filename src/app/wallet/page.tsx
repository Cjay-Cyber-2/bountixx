"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Minus, ShoppingBag } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { staggerContainer, slideUp } from "@/lib/animations";

type FilterTab = "ALL" | "EARNED" | "SPENT" | "PURCHASED";

const TRANSACTIONS = [
  { type: "earned",    desc: "Won String Reversal Clash",   amount: +300, date: "Jun 4, 2025" },
  { type: "spent",     desc: "Created arena (deducted)",    amount: -0,   date: "Jun 4, 2025" },
  { type: "earned",    desc: "Won Regex Warfare",           amount: +300, date: "Jun 2, 2025" },
  { type: "purchased", desc: "Elite bundle — 750 coins",    amount: +750, date: "May 30, 2025" },
  { type: "spent",     desc: "Created 3 arenas",            amount: -0,   date: "May 28, 2025" },
  { type: "earned",    desc: "Placed 2nd in Math Sprint",   amount: +150, date: "May 25, 2025" },
];

const BUNDLES = [
  { label: "Starter",    coins: 100,  price: "$0.99",  popular: false },
  { label: "Challenger", coins: 300,  price: "$2.49",  popular: false },
  { label: "Elite",      coins: 750,  price: "$4.99",  popular: true  },
  { label: "Champion",   coins: 2000, price: "$11.99", popular: false },
  { label: "Legendary",  coins: 5500, price: "$27.99", popular: false },
];

export default function WalletPage() {
  const [filter, setFilter] = useState<FilterTab>("ALL");
  const [selected, setSelected] = useState(2); // Elite by default

  const filtered = filter === "ALL"
    ? TRANSACTIONS
    : TRANSACTIONS.filter((t) => t.type === filter.toLowerCase());

  return (
    <AppLayout>
      <div className="px-6 lg:px-10 py-8 max-w-5xl">
        <h1 className="font-orbitron font-bold text-2xl text-haze tracking-wide mb-10">
          YOUR WALLET
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
          {/* ── Left: Balance + history ── */}
          <div className="flex flex-col gap-8">
            {/* Large balance */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-cosmos-2 border border-cosmos-4 p-8 flex items-center gap-6 clip-arena"
            >
              {/* Coin illustration */}
              <div
                className="w-20 h-20 rounded-full border-4 border-crown flex items-center justify-center shrink-0"
                style={{ background: "radial-gradient(circle at 35% 35%, #FBBF24, #F0A500 60%, #D97706)" }}
              >
                <span className="font-orbitron font-bold text-2xl text-amber-900">BX</span>
              </div>
              <div>
                <p className="font-share-mono text-[10px] text-haze-3 tracking-widest mb-1">
                  BOUNTIXX COINS
                </p>
                <AnimatedNumber
                  value={450}
                  className="font-orbitron font-black text-6xl text-crown block"
                />
              </div>
            </motion.div>

            {/* Filter tabs */}
            <div className="flex gap-0 border-b border-cosmos-4">
              {(["ALL", "EARNED", "SPENT", "PURCHASED"] as FilterTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-4 py-3 font-share-mono text-[10px] tracking-widest border-b-2 transition-all ${
                    filter === tab
                      ? "border-ignite text-ignite"
                      : "border-transparent text-haze-3 hover:text-haze-2"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Transaction list */}
            <div className="flex flex-col gap-0 bg-cosmos-2 border border-cosmos-4 overflow-hidden">
              {filtered.length === 0 ? (
                <div className="p-10 text-center">
                  <p className="font-rajdhani font-bold text-lg text-haze-2">NO TRANSACTIONS</p>
                  <p className="font-rajdhani text-sm text-haze-3 mt-1">
                    Win arenas or purchase coins to get started.
                  </p>
                </div>
              ) : (
                filtered.map((t, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-4 px-5 py-4 border-b border-cosmos-4 last:border-0 hover:bg-cosmos-3 transition-colors ${
                      i % 2 === 0 ? "" : "bg-cosmos/30"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-none flex items-center justify-center shrink-0 ${
                        t.amount > 0 ? "bg-success/10" : "bg-danger/10"
                      }`}
                    >
                      {t.amount > 0 ? (
                        <Plus size={14} className="text-success" aria-hidden="true" />
                      ) : (
                        <Minus size={14} className="text-danger" aria-hidden="true" />
                      )}
                    </div>
                    <p className="flex-1 font-rajdhani font-semibold text-sm text-haze truncate">
                      {t.desc}
                    </p>
                    <span
                      className={`font-orbitron font-bold text-sm shrink-0 ${
                        t.amount > 0 ? "text-success" : "text-danger"
                      }`}
                    >
                      {t.amount > 0 ? `+${t.amount}` : t.amount === 0 ? "FREE" : t.amount}
                    </span>
                    <span className="font-share-mono text-[10px] text-haze-3 shrink-0">{t.date}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ── Right: Buy coins ── */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-5"
          >
            <motion.div variants={slideUp}>
              <p className="font-share-mono text-[10px] text-haze-3 tracking-widest mb-1 uppercase">
                Purchase
              </p>
              <h2 className="font-orbitron font-bold text-2xl text-haze">BUY COINS</h2>
            </motion.div>

            {BUNDLES.map((b, i) => (
              <motion.button
                key={b.label}
                variants={slideUp}
                onClick={() => setSelected(i)}
                className={`relative text-left p-4 border transition-all hover:-translate-y-0.5 clip-arena-sm ${
                  selected === i
                    ? "border-ignite bg-ignite/8"
                    : "border-cosmos-4 bg-cosmos-2 hover:border-ignite/50"
                }`}
              >
                {b.popular && (
                  <span className="absolute top-2 right-2 font-share-mono text-[8px] text-cosmos bg-ignite px-2 py-0.5 tracking-widest">
                    MOST POPULAR
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-orbitron font-bold text-2xl text-crown">
                      {b.coins.toLocaleString()}
                    </p>
                    <p className="font-share-mono text-[9px] text-haze-3 mt-0.5 uppercase">
                      {b.label}
                    </p>
                  </div>
                  <p className="font-rajdhani font-bold text-xl text-haze">{b.price}</p>
                </div>
              </motion.button>
            ))}

            <Button variant="primary" fullWidth size="lg" magnetic className="mt-2">
              <ShoppingBag size={16} aria-hidden="true" />
              PROCEED TO PAYMENT
            </Button>

            {/* Trust signals */}
            <p className="font-share-mono text-[9px] text-haze-3 text-center tracking-wider">
              Secure payment · Instant delivery · No subscription
            </p>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
