"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const CATEGORIES = [
  {
    label: "Coding",
    accent: "#FF6B1A",
    accentDim: "rgba(255,107,26,0.12)",
    accentBorder: "rgba(255,107,26,0.25)",
    desc: "Functions, algorithms, data structures. Write directly in the sandboxed editor — JavaScript and Python supported.",
    sample: "fn reverse(s) → s[::-1]",
    win: "First to pass all 20 hidden tests",
    partial: "% of test cases passed",
  },
  {
    label: "Trivia",
    accent: "#a855f7",
    accentDim: "rgba(168,85,247,0.10)",
    accentBorder: "rgba(168,85,247,0.22)",
    desc: "General knowledge, pop culture, history. The correct answer is hashed and locked before anyone enters the room.",
    sample: "In what year did…?",
    win: "First correct submission wins",
    partial: "N/A — correct or incorrect",
  },
  {
    label: "Logic",
    accent: "#00D68F",
    accentDim: "rgba(0,214,143,0.09)",
    accentBorder: "rgba(0,214,143,0.22)",
    desc: "Puzzles, riddles, lateral thinking. The answer is objective — the trap is the obvious choice.",
    sample: "If A < B and B < C…",
    win: "First correct submission wins",
    partial: "Closest numeric or text match",
  },
  {
    label: "Math",
    accent: "#F0A500",
    accentDim: "rgba(240,165,0,0.09)",
    accentBorder: "rgba(240,165,0,0.22)",
    desc: "Speed arithmetic, equations, proofs. Pure calculation against opponents who are exactly as fast.",
    sample: "∑ x² + y , x∈[1,n]",
    win: "First correct submission wins",
    partial: "Closest numeric value on timeout",
  },
] as const;

export function Categories() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });

  return (
    <section
      id="categories"
      ref={ref}
      className="relative py-36 md:py-48 px-6 lg:px-14 overflow-hidden"
      style={{ background: "var(--cosmos-2)", borderTop: "1px solid var(--border-1)", borderBottom: "1px solid var(--border-1)" }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 50% at 90% 80%, var(--glow-1), transparent)" }}
        aria-hidden
      />

      <div className="max-w-[1280px] mx-auto relative">
        <div className="mb-20 md:mb-24">
          <h2 className="font-zen-dots text-[clamp(2rem,4.8vw,3.6rem)] text-haze leading-[1.08]">
            Choose your battleground.
          </h2>
          <p className="font-rajdhani text-lg text-haze-2 mt-5 max-w-lg leading-relaxed">
            Four challenge formats, each with its own win condition and scoring rules.
          </p>
        </div>

        {/* Featured row: first two side by side at 50/50, then two smaller below */}
        <motion.div
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          variants={{ show: { transition: { staggerChildren: 0.09 } } }}
          className="grid grid-cols-1 md:grid-cols-2 gap-px"
          style={{ background: "var(--border-1)" }}
        >
          {CATEGORIES.map((cat) => (
            <motion.div
              key={cat.label}
              variants={{
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
              }}
              className="group relative flex flex-col gap-7 p-9 md:p-11 transition-colors duration-300"
              style={{
                background: "var(--cosmos)",
              }}
            >
              {/* Hover tint */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
                style={{ background: cat.accentDim }}
                aria-hidden
              />

              <div className="relative">
                {/* Label + accent line */}
                <div className="flex items-center gap-3 mb-6">
                  <span
                    className="block w-8 h-[3px] rounded-full"
                    style={{ background: cat.accent }}
                    aria-hidden
                  />
                  <h3 className="font-zen-dots text-2xl text-haze">{cat.label}</h3>
                </div>

                <p className="font-rajdhani text-[17px] text-haze-2 leading-relaxed mb-7">
                  {cat.desc}
                </p>

                {/* Console sample */}
                <div
                  className="flex items-center gap-3 px-4 py-3 font-space-mono text-[13px] rounded-sm mb-7"
                  style={{
                    background: "var(--terminal-bg)",
                    border: "1px solid var(--terminal-border)",
                  }}
                >
                  <span style={{ color: cat.accent }}>›</span>
                  <span className="text-haze-2 truncate">{cat.sample}</span>
                </div>

                {/* Win condition + partial */}
                <div
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-5"
                  style={{ borderTop: `1px solid var(--border-1)` }}
                >
                  <span className="font-space-mono text-[10px] text-haze-3 uppercase tracking-wider">{cat.win}</span>
                  <span className="font-space-mono text-[10px] uppercase tracking-wider" style={{ color: cat.accent }}>
                    Partial: {cat.partial}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
