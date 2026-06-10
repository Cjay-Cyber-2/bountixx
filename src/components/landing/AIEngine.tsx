"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const SPECS = [
  { label: "Task classification", value: "4 formats · AI-assigned" },
  { label: "Difficulty rating",   value: "Recruit → Legendary" },
  { label: "Test case generation", value: "5 public · 20 hidden" },
  { label: "Edit window",          value: "Full control before publish" },
  { label: "Judgment engine",      value: "Deterministic · Server-side" },
  { label: "Submission timeout",   value: "5 s · 128 MB RAM cap" },
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
    note: "Judge0 isolated containers run every submission. 5s timeout, 128MB RAM hard cap. No exceptions.",
  },
] as const;

export function AIEngine() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });

  return (
    <section
      className="relative py-36 md:py-48 px-6 lg:px-14 bg-cosmos overflow-hidden"
      ref={ref}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 55% 55% at 50% 20%, var(--glow-1), transparent)" }}
        aria-hidden
      />

      <div className="max-w-[1180px] mx-auto relative">
        {/* Intro: narrative left, spec tiles right */}
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-16 lg:gap-24 mb-28 md:mb-36 items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="font-zen-dots text-[clamp(1.9rem,4.5vw,3.4rem)] text-haze leading-[1.1] mb-8 text-balance">
              AI sets the stage.{" "}
              <span style={{ color: "var(--void)" }}>You claim the crown.</span>
            </h2>
            <p className="font-rajdhani text-lg md:text-xl text-haze-2 leading-relaxed mb-5">
              The AI engine is a creation assistant, not a referee. It reads raw task briefs, structures the details, and sets up test cases.
            </p>
            <p className="font-rajdhani text-base text-haze-3 leading-relaxed">
              Before any lobby goes live, the room creator has full editing control over the title, difficulty, and test cases, preventing hallucinations and guaranteeing fair play. The actual winner is always decided by a deterministic system.
            </p>
          </motion.div>

          {/* Spec tiles: 2-column ledger grid */}
          <motion.div
            initial="hidden"
            animate={inView ? "show" : "hidden"}
            variants={{ show: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } } }}
            className="grid grid-cols-2 gap-px"
            style={{ background: "var(--border-1)", border: "1px solid var(--border-1)" }}
          >
            {SPECS.map((row) => (
              <motion.div
                key={row.label}
                variants={{
                  hidden: { opacity: 0 },
                  show: { opacity: 1, transition: { duration: 0.5 } },
                }}
                className="p-5 md:p-6 flex flex-col gap-2"
                style={{ background: "var(--cosmos)" }}
              >
                <span className="font-space-mono text-[12px] text-haze leading-snug">
                  {row.value}
                </span>
                <span className="font-rajdhani text-sm text-haze-3">{row.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Anti-cheat: 2x2 grid, the system speaks for itself */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex flex-wrap items-center gap-4 mb-10">
            <h3 className="font-zen-dots text-2xl md:text-3xl text-haze">Anti-cheat</h3>
            <span
              className="font-space-mono text-[9px] tracking-[2px] uppercase px-2 py-1 rounded-sm"
              style={{ background: "var(--void-tint)", color: "var(--void)", border: "1px solid var(--border-accent)" }}
            >
              Active in every session
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-px" style={{ background: "var(--border-1)", border: "1px solid var(--border-1)" }}>
            {ANTI_CHEAT.map((ac, i) => (
              <motion.div
                key={ac.label}
                initial={{ opacity: 0, y: 12 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.45, delay: 0.4 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="p-7 md:p-9"
                style={{ background: "var(--cosmos)" }}
              >
                <p className="font-space-mono text-[12px] tracking-[1px] uppercase mb-3" style={{ color: "var(--void)" }}>
                  {ac.label}
                </p>
                <p className="font-rajdhani text-[15px] text-haze-2 leading-relaxed max-w-[48ch]">
                  {ac.note}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
