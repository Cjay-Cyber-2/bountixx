"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { staggerContainer, slideUp } from "@/lib/animations";
import { XPBar } from "@/components/ui/XPBar";

const ranks = [
  {
    name: "RECRUIT",
    xp: "0 XP",
    desc: "The beginning",
    color: "#6B7280",
    gradFrom: "#374151",
    gradTo: "#6B7280",
  },
  {
    name: "CHALLENGER",
    xp: "500 XP",
    desc: "Warming up",
    color: "#FF6B1A",
    gradFrom: "#FF6B1A",
    gradTo: "#F97316",
  },
  {
    name: "ELITE",
    xp: "2,000 XP",
    desc: "Formidable",
    color: "#F0A500",
    gradFrom: "#F0A500",
    gradTo: "#FBBF24",
  },
  {
    name: "CHAMPION",
    xp: "7,500 XP",
    desc: "Feared",
    color: "#9B6BFF",
    gradFrom: "#9B6BFF",
    gradTo: "#C77DFF",
  },
  {
    name: "LEGENDARY",
    xp: "20,000 XP",
    desc: "Untouchable",
    color: "#F0A500",
    gradFrom: "#FF6B1A",
    gradTo: "#F0A500",
  },
];

function RankBadge({ color, name, gradient }: { color: string; name: string; gradient: string[] }) {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`rg-${name}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={gradient[0]} />
          <stop offset="100%" stopColor={gradient[1]} />
        </linearGradient>
      </defs>
      {name === "LEGENDARY" ? (
        /* Crown shape for legendary */
        <path d="M24 4L30 18L44 14L36 28L44 44H4L12 28L4 14L18 18L24 4Z" fill={`url(#rg-${name})`} />
      ) : name === "CHAMPION" ? (
        /* Shield for champion */
        <path d="M24 4L44 12V28C44 38 24 44 24 44C24 44 4 38 4 28V12L24 4Z" fill={`url(#rg-${name})`} />
      ) : name === "ELITE" ? (
        /* Star for elite */
        <path d="M24 4L28.9 17.6H43.3L31.7 26.2L36.6 39.8L24 31.2L11.4 39.8L16.3 26.2L4.7 17.6H19.1L24 4Z" fill={`url(#rg-${name})`} />
      ) : name === "CHALLENGER" ? (
        /* Diamond for challenger */
        <path d="M24 4L44 24L24 44L4 24L24 4Z" fill={`url(#rg-${name})`} />
      ) : (
        /* Hexagon for recruit */
        <path d="M24 4L42 14V34L24 44L6 34V14L24 4Z" fill={`url(#rg-${name})`} />
      )}
      <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" fontFamily="monospace">
        {name.slice(0, 3)}
      </text>
    </svg>
  );
}

export function RankShowcase() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-8% 0px" });

  return (
    <section id="ranks" className="py-36 px-6 lg:px-14 bg-cosmos-2 border-y border-cosmos-4" ref={ref}>
      <div className="max-w-[1400px] mx-auto">
        <p className="font-share-mono text-xs text-ignite tracking-[6px] mb-4 uppercase">
          Progression System
        </p>
        <h2 className="font-orbitron font-bold text-4xl lg:text-5xl text-haze mb-16">
          RISE THROUGH THE RANKS
        </h2>

        {/* Rank cards */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          className="flex gap-4 overflow-x-auto pb-4 lg:grid lg:grid-cols-5"
          style={{ scrollbarWidth: "none" }}
        >
          {ranks.map((rank) => (
            <motion.div
              key={rank.name}
              variants={slideUp}
              className="group relative bg-cosmos border border-cosmos-4 p-5 min-w-[160px] lg:min-w-0 cursor-default
                         hover:scale-[1.04] hover:border-opacity-60 transition-all duration-200 clip-arena-sm"
              style={{ borderTop: `2px solid ${rank.color}` }}
            >
              <motion.div
                className="mb-3"
                whileHover={{ rotate: 15 }}
                transition={{ type: "spring", damping: 12 }}
              >
                <RankBadge color={rank.color} name={rank.name} gradient={[rank.gradFrom, rank.gradTo]} />
              </motion.div>
              <p className="font-orbitron font-bold text-sm text-haze tracking-wide mb-0.5">
                {rank.name}
              </p>
              <p className="font-share-mono text-[10px] mb-2" style={{ color: rank.color }}>
                {rank.xp}
              </p>
              <p className="font-rajdhani text-xs text-haze-3 opacity-0 group-hover:opacity-100 transition-opacity">
                {rank.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* XP bar demo */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-12 bg-cosmos border border-cosmos-4 p-6 max-w-xl"
        >
          <p className="font-share-mono text-[10px] text-ignite tracking-widest mb-3 uppercase">
            Champion · 6,820 / 10,000 XP
          </p>
          <XPBar current={6820} max={10000} thick color="void" />
        </motion.div>
      </div>
    </section>
  );
}
