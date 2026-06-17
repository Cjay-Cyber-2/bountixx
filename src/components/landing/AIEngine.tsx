"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Accent, LandingSection, SectionHeading, SectionIntro, SpecLine } from "@/components/landing/_section";

const SPECS = [
  { label: "Task classification", value: "4 formats · AI-assigned" },
  { label: "Difficulty rating", value: "Recruit → Legendary" },
  { label: "Test case generation", value: "5 public · 20 hidden" },
  { label: "Edit window", value: "Full control before publish" },
  { label: "Judgment engine", value: "Deterministic · Server-side" },
  { label: "Submission timeout", value: "5 s · 128 MB RAM cap" },
] as const;

const ANTI_CHEAT = [
  {
    label: "Paste blocked",
    note: "onpaste intercepted. Clipboard API calls are silently suppressed for the duration of every session.",
  },
  {
    label: "Tab monitoring",
    note: "document.visibilitychange tracks every exit. Three strikes and the admin receives an instant flag.",
  },
  {
    label: "Focus tracking",
    note: "window.blur events are logged in real time. Every defocus appears in the post-room integrity report.",
  },
  {
    label: "Sandbox execution",
    note: "Every submission runs in an isolated sandbox container. 5s timeout, 128MB RAM hard cap. No exceptions.",
  },
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

        <div className="flex flex-col items-center gap-12 lg:gap-16 xl:gap-20 mb-20 md:mb-28 lg:mb-32">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl mx-auto text-center"
          >
            <SpecLine>The engine</SpecLine>
            <SectionHeading className="mt-5 md:mt-6 mb-6 md:mb-8">
              AI sets the stage. <Accent>You claim the crown.</Accent>
            </SectionHeading>
            <p className="font-rajdhani text-lg md:text-xl text-haze-2 leading-relaxed mb-5 max-w-[58ch] mx-auto">
              The AI engine is a creation assistant, not a referee. It reads raw task briefs, structures the details, and sets up test cases.
            </p>
            <p className="font-rajdhani text-base text-haze-3 leading-relaxed max-w-[58ch] mx-auto">
              Before any lobby goes live, the room creator has full editing control over the title, difficulty, and test cases. The winner is always decided by a deterministic system.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            animate={inView ? "show" : "hidden"}
            variants={{ show: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } } }}
            className="grid grid-cols-2 gap-px w-full"
            style={{ background: "var(--border-1)", border: "1px solid var(--border-1)" }}
          >
            {SPECS.map((row) => (
              <motion.div
                key={row.label}
                variants={{
                  hidden: { opacity: 0 },
                  show: { opacity: 1, transition: { duration: 0.5 } },
                }}
                className="p-5 md:p-7 flex flex-col gap-2.5 text-center items-center"
                style={{ background: "var(--cosmos)" }}
              >
                <span className="font-space-mono text-[12px] text-haze leading-snug">{row.value}</span>
                <span className="font-rajdhani text-sm text-haze-3">{row.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

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
              Active in every session
            </span>
          </div>

          <div
            className="grid md:grid-cols-2 gap-px w-full"
            style={{ background: "var(--border-1)", border: "1px solid var(--border-1)" }}
          >
            {ANTI_CHEAT.map((ac, i) => (
              <motion.div
                key={ac.label}
                initial={{ opacity: 0, y: 12 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.45, delay: 0.4 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="p-7 md:p-9 lg:p-10 text-center"
                style={{ background: "var(--cosmos)" }}
              >
                <p className="font-space-mono text-[12px] tracking-[1px] uppercase mb-3 text-void">
                  {ac.label}
                </p>
                <p className="font-rajdhani text-[15px] md:text-base text-haze-2 leading-relaxed max-w-[48ch] mx-auto">
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
