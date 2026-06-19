"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Accent, LandingSection, SectionHeading, SpecLine } from "@/components/landing/_section";

const SPECS = [
  { label: "Classification", value: "4 formats · AI-assigned" },
  { label: "Difficulty", value: "Recruit → Legendary" },
  { label: "Test cases", value: "5 public · 20 hidden" },
  { label: "Judgment", value: "Deterministic · Server-side" },
] as const;

const ANTI_CHEAT = [
  { label: "Paste blocked", note: "Clipboard API intercepted for the entire session." },
  { label: "Tab monitoring", note: "Visibility changes tracked — one strike and you're flagged." },
  { label: "Focus tracking", note: "Blur events logged in real time, visible in post-room report." },
  { label: "Sandboxed exec", note: "Isolated containers. 5s timeout, 128MB RAM hard cap." },
] as const;

export function AIEngine() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });

  return (
    <LandingSection>
      <div ref={ref} className="relative">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 55% 55% at 50% 20%, var(--glow-1), transparent)" }}
          aria-hidden
        />

        {/* Main intro */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl mx-auto text-center mb-14 md:mb-18 lg:mb-20"
        >
          <SpecLine>The engine</SpecLine>
          <SectionHeading className="mt-5 md:mt-6 mb-6 md:mb-8">
            AI sets the stage. <Accent>You claim the crown.</Accent>
          </SectionHeading>
          <p className="font-rajdhani text-lg md:text-xl text-haze-2 leading-relaxed max-w-[52ch] mx-auto">
            The AI reads raw task briefs, structures the challenge, and generates test cases. You keep full editing control before the lobby goes live.
          </p>
        </motion.div>

        {/* Specs — single row */}
        <motion.div
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          variants={{ show: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } } }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-px mb-20 md:mb-28"
          style={{ background: "var(--border-1)", border: "1px solid var(--border-1)" }}
        >
          {SPECS.map((row) => (
            <motion.div
              key={row.label}
              variants={{
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { duration: 0.5 } },
              }}
              className="p-6 md:p-8 flex flex-col gap-2 text-center items-center"
              style={{ background: "var(--cosmos)" }}
            >
              <span className="font-space-mono text-[13px] text-haze leading-snug">{row.value}</span>
              <span className="font-rajdhani text-sm text-haze-3">{row.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Anti-cheat */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8 md:mb-10 text-center">
            <h3 className="font-zen-dots text-2xl md:text-3xl text-haze">Anti-cheat</h3>
            <span
              className="font-space-mono text-[9px] tracking-[2px] uppercase px-2.5 py-1 rounded-sm text-void"
              style={{ background: "var(--void-tint)", border: "1px solid var(--border-accent)" }}
            >
              Always active
            </span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {ANTI_CHEAT.map((ac, i) => (
              <motion.div
                key={ac.label}
                initial={{ opacity: 0, y: 12 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.45, delay: 0.4 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="p-6 md:p-7 text-center"
                style={{ background: "var(--cosmos-2)", border: "1px solid var(--border-1)" }}
              >
                <p className="font-space-mono text-[11px] tracking-[1px] uppercase mb-2 text-void">
                  {ac.label}
                </p>
                <p className="font-rajdhani text-sm text-haze-2 leading-relaxed">
                  {ac.note}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </LandingSection>
  );
}
