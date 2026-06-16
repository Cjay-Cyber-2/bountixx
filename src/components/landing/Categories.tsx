"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const CATEGORIES = [
  {
    label: "Coding",
    accent: "#FF6B1A",
    desc: "Functions, algorithms, and data structures, written directly in a sandboxed editor. JavaScript and Python supported.",
    sample: "fn reverse(s) -> s[::-1]",
    win: "First to pass all 20 hidden tests",
    partial: "Scored by percentage of test cases passed",
  },
  {
    label: "Trivia",
    accent: "#22D3EE",
    desc: "General knowledge, pop culture, and history. The correct answer is hashed and locked before anyone enters the room.",
    sample: "In what year did...?",
    win: "First correct submission wins",
    partial: "No partial credit, correct or incorrect",
  },
  {
    label: "Logic",
    accent: "#00D68F",
    desc: "Puzzles, riddles, and lateral thinking. The answer is objective. The trap is always the obvious choice.",
    sample: "If A < B and B < C...",
    win: "First correct submission wins",
    partial: "Closest numeric or text match on timeout",
  },
  {
    label: "Math",
    accent: "#F0A500",
    desc: "Speed arithmetic, equations, and proofs. Pure calculation against opponents who are exactly as fast as you.",
    sample: "the sum of x squared plus y",
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
      className="cyber-grid relative py-28 md:py-40 px-6 sm:px-10 lg:px-16 overflow-hidden"
      style={{
        background: "var(--cosmos-2)",
        borderTop: "1px solid var(--border-1)",
        borderBottom: "1px solid var(--border-1)",
      }}
    >
      <div className="max-w-6xl mx-auto relative">
        {/* Header */}
        <div className="mb-16 md:mb-20 max-w-2xl">
          <p className="font-space-mono text-[11px] tracking-[5px] uppercase mb-5 flex items-center gap-3" style={{ color: "var(--cyber)" }}>
            <span className="h-px w-8" style={{ background: "var(--cyber)", opacity: 0.6 }} aria-hidden />
            Four formats
          </p>
          <h2 className="font-zen-dots text-[clamp(2rem,4.6vw,3.4rem)] text-haze leading-[1.18]">
            Choose your battleground.
          </h2>
          <p className="font-rajdhani text-lg md:text-xl text-haze-2 mt-6 leading-relaxed">
            Every format has its own win condition and scoring rules. Pick the
            arena that plays to your strengths.
          </p>
        </div>

        {/* 2x2 grid — each format gets its own breathing room */}
        <motion.div
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          variants={{ show: { transition: { staggerChildren: 0.1 } } }}
          className="grid sm:grid-cols-2 gap-5 md:gap-6"
        >
          {CATEGORIES.map((cat) => (
            <motion.div
              key={cat.label}
              variants={{
                hidden: { opacity: 0, y: 24 },
                show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
              }}
              className="group relative flex flex-col p-8 md:p-10 transition-transform duration-300 hover:-translate-y-1"
              style={{
                background: "var(--cosmos)",
                border: "1px solid var(--border-1)",
                borderTop: `2px solid ${cat.accent}`,
              }}
            >
              {/* glow on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: `radial-gradient(ellipse 70% 50% at 50% 0%, ${cat.accent}14, transparent 70%)` }}
                aria-hidden
              />

              <h3
                className="font-zen-dots text-2xl md:text-3xl leading-none mb-5"
                style={{ color: cat.accent }}
              >
                {cat.label}
              </h3>

              <p className="font-rajdhani text-[17px] text-haze-2 leading-relaxed mb-6">
                {cat.desc}
              </p>

              <p className="font-space-mono text-[13px] text-haze-3 mb-8">
                <span style={{ color: cat.accent }}>&rsaquo;</span> {cat.sample}
              </p>

              <div className="mt-auto pt-6 space-y-2.5" style={{ borderTop: "1px solid var(--border-1)" }}>
                <p className="font-space-mono text-[11px] uppercase tracking-[2px] text-haze leading-relaxed">
                  {cat.win}
                </p>
                <p className="font-space-mono text-[10px] uppercase tracking-[2px] leading-relaxed" style={{ color: cat.accent }}>
                  {cat.partial}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
