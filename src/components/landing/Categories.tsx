"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { LandingSection, SectionIntro } from "@/components/landing/_section";

const CATEGORIES = [
  {
    label: "Coding",
    desc: "Algorithms, data structures, and problem solving in a sandboxed editor.",
    win: "First to pass all hidden tests",
    color: "#FF6B1A",
  },
  {
    label: "Trivia",
    desc: "General knowledge, pop culture, and history. Answer locked before anyone enters.",
    win: "First correct submission",
    color: "#9B6BFF",
  },
  {
    label: "Logic",
    desc: "Puzzles, riddles, and lateral thinking. The trap is always the obvious choice.",
    win: "First correct submission",
    color: "#00D68F",
  },
  {
    label: "Math",
    desc: "Speed arithmetic, equations, and proofs. Pure calculation under pressure.",
    win: "First correct submission",
    color: "#F0A500",
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
          description="Every format has its own win condition. Pick the arena that plays to your strengths."
        />

        <motion.div
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          variants={{ show: { transition: { staggerChildren: 0.1 } } }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6"
        >
          {CATEGORIES.map((cat) => (
            <motion.article
              key={cat.label}
              variants={{
                hidden: { opacity: 0, y: 24 },
                show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
              }}
              className="group relative flex flex-col p-7 md:p-8 transition-transform duration-300 hover:-translate-y-1"
              style={{
                background: "var(--cosmos)",
                border: "1px solid var(--border-1)",
              }}
            >
              {/* Top accent line */}
              <span
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{ background: cat.color }}
                aria-hidden
              />

              {/* Hover glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${cat.color}12, transparent 70%)`,
                }}
                aria-hidden
              />

              <h3
                className="font-zen-dots text-xl text-haze leading-none mb-4"
                style={{ color: cat.color }}
              >
                {cat.label}
              </h3>

              <p className="font-rajdhani text-[15px] text-haze-2 leading-relaxed mb-6 flex-1">
                {cat.desc}
              </p>

              <div className="pt-4" style={{ borderTop: "1px solid var(--border-1)" }}>
                <p className="font-space-mono text-[10px] uppercase tracking-[2px] text-haze-3 leading-relaxed">
                  {cat.win}
                </p>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </LandingSection>
  );
}
