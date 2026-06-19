"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { LandingSection, CenteredSectionIntro } from "@/components/landing/_section";

const CATEGORIES = [
  {
    label: "Coding",
    desc: "Functions, algorithms, and data structures in a sandboxed editor. JavaScript and Python supported.",
    sample: "fn reverse(s) -> s[::-1]",
    win: "First to pass all 20 hidden tests",
    partial: "Scored by percentage of test cases passed",
  },
  {
    label: "Trivia",
    desc: "General knowledge, pop culture, and history. The correct answer is hashed and locked before anyone enters the room.",
    sample: "In what year did...?",
    win: "First correct submission wins",
    partial: "No partial credit — correct or incorrect",
  },
  {
    label: "Logic",
    desc: "Puzzles, riddles, and lateral thinking. The answer is objective. The trap is always the obvious choice.",
    sample: "If A < B and B < C...",
    win: "First correct submission wins",
    partial: "Closest numeric or text match on timeout",
  },
  {
    label: "Math",
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
    <LandingSection id="categories" variant="raised" className="pt-40 md:pt-48 lg:pt-56">
      <div ref={ref} className="w-full">
        <CenteredSectionIntro
          eyebrow="Four formats"
          title="Choose your battleground."
          description="Every format has its own win condition and scoring rules. Pick the arena that plays to your strengths."
        />

        <motion.div
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          variants={{ show: { transition: { staggerChildren: 0.1 } } }}
          className="grid sm:grid-cols-2 gap-8 md:gap-10 lg:gap-14"
        >
          {CATEGORIES.map((cat) => (
            <motion.article
              key={cat.label}
              variants={{
                hidden: { opacity: 0, y: 24 },
                show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
              }}
              className="landing-surface group relative flex flex-col items-center text-center rounded-xl transition-transform duration-300 hover:-translate-y-1"
              style={{
                background: "var(--cosmos)",
                border: "1px solid var(--border-1)",
                borderTop: "2px solid var(--void)",
              }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-xl"
                style={{
                  background:
                    "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(168,85,247,0.12), transparent 70%)",
                }}
                aria-hidden
              />

              <h3 className="font-zen-dots text-2xl md:text-[1.65rem] lg:text-3xl text-haze leading-none mb-6 md:mb-8">
                {cat.label}
              </h3>

              <p className="font-rajdhani text-[17px] md:text-lg text-haze-2 leading-[1.75] mb-8 md:mb-10 max-w-[44ch]">
                {cat.desc}
              </p>

              <p className="font-space-mono text-[13px] text-haze-3 mb-10 md:mb-12 leading-relaxed">
                <span className="text-void mr-2">&rsaquo;</span>
                {cat.sample}
              </p>

              <div className="mt-auto pt-8 md:pt-10 space-y-4 w-full" style={{ borderTop: "1px solid var(--border-1)" }}>
                <p className="font-space-mono text-[11px] uppercase tracking-[2px] text-haze leading-[1.7] px-2">
                  {cat.win}
                </p>
                <p className="font-space-mono text-[10px] uppercase tracking-[2px] text-haze-3 leading-[1.7] px-2">
                  {cat.partial}
                </p>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </LandingSection>
  );
}
