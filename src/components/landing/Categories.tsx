"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { CenteredSectionIntro, LANDING_CARD_GRID_2, LANDING_SURFACE, LandingSection } from "@/components/landing/_section";

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
          className={LANDING_CARD_GRID_2}
        >
          {CATEGORIES.map((cat) => (
            <motion.article
              key={cat.label}
              variants={{
                hidden: { opacity: 0, y: 24 },
                show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
              }}
              className={`${LANDING_SURFACE} landing-copy-stack group relative flex flex-col items-center text-center rounded-2xl border-2 transition-transform duration-300 hover:-translate-y-1`}
              style={{
                background: "var(--cosmos)",
                borderColor: "var(--border-1)",
                borderTop: "2px solid var(--void)",
              }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
                style={{
                  background:
                    "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(168,85,247,0.12), transparent 70%)",
                }}
                aria-hidden
              />

              <h3 className="font-zen-dots text-xl sm:text-2xl md:text-[1.65rem] lg:text-3xl text-haze leading-none">
                {cat.label}
              </h3>

              <p className="font-rajdhani text-base sm:text-[17px] md:text-lg text-haze-2 leading-[1.85] max-w-[42ch]">
                {cat.desc}
              </p>

              <p className="font-space-mono text-[12px] sm:text-[13px] text-haze-3 leading-[1.7] px-1 sm:px-2">
                <span className="text-void mr-2">&rsaquo;</span>
                {cat.sample}
              </p>

              <div
                className="landing-copy-stack mt-auto pt-[clamp(1.75rem,3vw,2.5rem)] w-full px-1 sm:px-2"
                style={{ borderTop: "1px solid var(--border-1)" }}
              >
                <p className="font-space-mono text-[11px] uppercase tracking-[2px] text-haze leading-[1.8]">
                  {cat.win}
                </p>
                <p className="font-space-mono text-[10px] uppercase tracking-[2px] text-haze-3 leading-[1.8]">
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
