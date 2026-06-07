"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const PHASE1_CATEGORIES = [
  {
    label: "Coding",
    accent: "#a855f7",
    tag: "01",
    desc: "Functions, algorithms, data structures. Write directly in the sandboxed editor with support for JavaScript and Python.",
    sample: "fn reverse(s) → s[::-1]",
    rule: "First to pass all 20 hidden tests",
    partial: "Partial: % of test cases passed",
  },
  {
    label: "Trivia",
    accent: "#a855f7",
    tag: "02",
    desc: "General knowledge, pop culture, and history. The canonical correct answer is hashed and locked before anyone enters.",
    sample: "In what year did…?",
    rule: "First correct submission wins",
    partial: "Partial: N/A (correct or incorrect)",
  },
  {
    label: "Logic",
    accent: "#a855f7",
    tag: "03",
    desc: "Puzzles, riddles, and lateral thinking. Read carefully — the answer is objective but the trap is usually the obvious choice.",
    sample: "If A < B and B < C…",
    rule: "First correct submission wins",
    partial: "Partial: Closest numeric or text match",
  },
  {
    label: "Math",
    accent: "#a855f7",
    tag: "04",
    desc: "Speed arithmetic, equations, and proofs. Pure speed and calculations against opponents who are just as fast.",
    sample: "∑ x² + y , x∈[1,n]",
    rule: "First correct submission wins",
    partial: "Partial: Closest numeric value on timeout",
  },
] as const;

const PHASE2_CATEGORIES = [
  { label: "Design", desc: "UI mockups, graphics, and visual layouts judged via peer voting and AI evaluation." },
  { label: "Writing", desc: "Creative copy, stories, and prompts evaluated through blind community voting." },
  { label: "Meme / Creative", desc: "Humorous edits and creative concepts with 100% blind peer choice." },
] as const;

export function Categories() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });

  return (
    <section
      id="categories"
      ref={ref}
      className="relative py-36 md:py-48 px-6 lg:px-14 bg-cosmos-2 border-y border-cosmos-4 overflow-hidden"
    >
      {/* Background radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 90% 80%, rgba(155,107,255,0.06) 0%, transparent 65%)",
        }}
        aria-hidden
      />

      <div className="max-w-[1280px] mx-auto relative">
        {/* Spacious Top Row */}
        <div className="mb-24 grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <p className="font-space-mono text-[10px] tracking-[5px] uppercase text-[#a855f7] mb-5">
              Arena Formats
            </p>
            <h2 className="font-zen-dots text-[clamp(2.2rem,5vw,3.8rem)] text-haze leading-[1.08]">
              What can you{" "}
              <span
                style={{
                  background: "linear-gradient(110deg,#a855f7 0%,#c084fc 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                challenge?
              </span>
            </h2>
          </div>
          <p className="font-rajdhani text-lg md:text-xl text-haze-2 leading-relaxed lg:pl-10">
            Bountixx turns any problem statement into a real-time multiplayer arena. The AI engine parses input parameters instantly, leaving only the question of who solves it first.
          </p>
        </div>

        {/* Phase 1 Grid - Spacious boxes with extra padding */}
        <motion.div
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          variants={{ show: { transition: { staggerChildren: 0.1 } } }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24"
        >
          {PHASE1_CATEGORIES.map((cat) => (
            <motion.div
              key={cat.label}
              variants={{
                hidden: { opacity: 0, y: 32 },
                show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } },
              }}
              className="group relative bg-cosmos p-10 md:p-12 flex flex-col gap-8 border border-cosmos-4 hover:border-void-light/30 transition-all duration-300 rounded-lg"
            >
              {/* Header row */}
              <div className="flex items-baseline justify-between border-b border-cosmos-4 pb-5">
                <span className="font-space-mono text-xs text-haze-3 tracking-[3px]">
                  {cat.tag}
                </span>
                <h3 className="font-zen-dots text-2xl text-haze">{cat.label}</h3>
              </div>

              {/* Description */}
              <p className="font-rajdhani text-lg text-haze-2 leading-relaxed min-h-[72px]">
                {cat.desc}
              </p>

              {/* Console preview */}
              <div
                className="flex items-center gap-3 px-5 py-3.5 font-space-mono text-xs rounded"
                style={{
                  background: "rgba(14,8,24,0.7)",
                  border: "1px solid rgba(45,27,105,0.8)",
                }}
              >
                <span className="text-[#a855f7]">›</span>
                <span className="text-haze-2 truncate">{cat.sample}</span>
              </div>

              {/* Bottom rule info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-4 border-t border-cosmos-4 text-[10px] font-space-mono text-haze-3 uppercase tracking-wider">
                <span>{cat.rule}</span>
                <span className="text-void">{cat.partial}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Phase 2 Preview Block */}
        <div className="border-t border-cosmos-4 pt-16">
          <p className="font-space-mono text-[10px] tracking-[4px] uppercase text-haze-3 mb-10">
            Coming in Phase 2 · Subjective Formats
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PHASE2_CATEGORIES.map((cat) => (
              <div
                key={cat.label}
                className="p-8 bg-cosmos-3/30 border border-cosmos-4 rounded-lg flex flex-col gap-3"
              >
                <h4 className="font-zen-dots text-lg text-haze-2">{cat.label}</h4>
                <p className="font-rajdhani text-base text-haze-3 leading-relaxed">
                  {cat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
