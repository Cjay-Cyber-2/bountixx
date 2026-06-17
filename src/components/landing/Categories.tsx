"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { LandingSection, SectionIntro } from "@/components/landing/_section";

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
    <LandingSection id="categories" variant="raised">
      <div ref={ref}>
        <SectionIntro
          eyebrow="Four formats"
          title="Choose your battleground."
          description="Every format has its own win condition and scoring rules. Pick the arena that plays to your strengths."
        />

        <motion.div
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          variants={{ show: { transition: { staggerChildren: 0.1 } } }}
          className="grid sm:grid-cols-2 gap-5 md:gap-7 lg:gap-8"
        >
          {CATEGORIES.map((cat) => (
            <motion.article
              key={cat.label}
              variants={{
                hidden: { opacity: 0, y: 24 },
                show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
              }}
              className="group relative flex flex-col items-center text-center p-8 md:p-10 lg:p-11 transition-transform duration-300 hover:-translate-y-1"
              style={{
                background: "var(--cosmos)",
                border: "1px solid var(--border-1)",
                borderTop: "2px solid var(--void)",
              }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(168,85,247,0.12), transparent 70%)",
                }}
                aria-hidden
              />

              <h3 className="font-zen-dots text-2xl md:text-[1.65rem] lg:text-3xl text-haze leading-none mb-5 md:mb-6">
                {cat.label}
              </h3>

              <p className="font-rajdhani text-[17px] md:text-lg text-haze-2 leading-relaxed mb-6 md:mb-8 max-w-[48ch]">
                {cat.desc}
              </p>

              <p className="font-space-mono text-[13px] text-haze-3 mb-8 md:mb-10">
                <span className="text-void mr-2">&rsaquo;</span>
                {cat.sample}
              </p>

              <div
                className="mt-auto pt-6 md:pt-7 space-y-3"
                style={{ borderTop: "1px solid var(--border-1)" }}
              >
                <p className="font-space-mono text-[11px] uppercase tracking-[2px] text-haze leading-relaxed">
                  {cat.win}
                </p>
                <p className="font-space-mono text-[10px] uppercase tracking-[2px] text-haze-3 leading-relaxed">
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
