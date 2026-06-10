"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const CATEGORIES = [
  {
    label: "Coding",
    accent: "#FF6B1A",
    accentDim: "rgba(255,107,26,0.07)",
    desc: "Functions, algorithms, data structures. Write directly in the sandboxed editor. JavaScript and Python supported.",
    sample: "fn reverse(s) → s[::-1]",
    win: "First to pass all 20 hidden tests",
    partial: "% of test cases passed",
  },
  {
    label: "Trivia",
    accent: "#a855f7",
    accentDim: "rgba(168,85,247,0.06)",
    desc: "General knowledge, pop culture, history. The correct answer is hashed and locked before anyone enters the room.",
    sample: "In what year did…?",
    win: "First correct submission wins",
    partial: "N/A - correct or incorrect",
  },
  {
    label: "Logic",
    accent: "#00D68F",
    accentDim: "rgba(0,214,143,0.06)",
    desc: "Puzzles, riddles, lateral thinking. The answer is objective. The trap is the obvious choice.",
    sample: "If A < B and B < C…",
    win: "First correct submission wins",
    partial: "Closest numeric or text match",
  },
  {
    label: "Math",
    accent: "#F0A500",
    accentDim: "rgba(240,165,0,0.06)",
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
        <div className="mb-20 md:mb-28 max-w-2xl">
          <h2 className="font-zen-dots text-[clamp(2rem,4.8vw,3.6rem)] text-haze leading-[1.08] text-balance">
            Choose your battleground.
          </h2>
          <p className="font-rajdhani text-lg text-haze-2 mt-5 max-w-lg leading-relaxed">
            Four challenge formats, each with its own win condition and scoring rules.
          </p>
        </div>

        {/* Index ledger: each format is one oversized row */}
        <motion.div
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          variants={{ show: { transition: { staggerChildren: 0.1 } } }}
          style={{ borderTop: "1px solid var(--border-1)" }}
        >
          {CATEGORIES.map((cat) => (
            <motion.div
              key={cat.label}
              variants={{
                hidden: { opacity: 0, y: 24 },
                show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
              }}
              className="group relative grid grid-cols-1 lg:grid-cols-[minmax(220px,0.8fr)_1.4fr_1fr] gap-6 lg:gap-12 items-start py-10 md:py-12 px-2 md:px-4 transition-colors duration-300"
              style={{ borderBottom: "1px solid var(--border-1)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = cat.accentDim)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {/* Format name, the row's anchor */}
              <h3
                className="font-zen-dots leading-none transition-transform duration-300 group-hover:translate-x-2"
                style={{ fontSize: "clamp(1.9rem, 4vw, 3rem)", color: cat.accent }}
              >
                {cat.label}
              </h3>

              {/* Description + sample */}
              <div>
                <p className="font-rajdhani text-[17px] text-haze-2 leading-relaxed mb-5 max-w-[52ch]">
                  {cat.desc}
                </p>
                <p className="font-space-mono text-[13px] text-haze-3">
                  <span style={{ color: cat.accent }}>›</span>{" "}
                  {cat.sample}
                </p>
              </div>

              {/* Win conditions */}
              <div className="flex flex-col gap-3 lg:items-end lg:text-right">
                <p className="font-space-mono text-[11px] uppercase tracking-wider text-haze">
                  {cat.win}
                </p>
                <p className="font-space-mono text-[10px] uppercase tracking-wider" style={{ color: cat.accent }}>
                  Partial: {cat.partial}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
