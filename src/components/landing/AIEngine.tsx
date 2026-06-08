"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Shield, Eye, Activity, Server } from "lucide-react";

const ANTI_CHEAT = [
  {
    Icon: Shield,
    label: "Paste blocked",
    note: "onpaste intercepted. Clipboard API calls are silently suppressed for the duration of every session.",
    tag: "clipboard",
  },
  {
    Icon: Eye,
    label: "Tab monitoring",
    note: "document.visibilitychange tracks every exit. Three strikes and the admin receives an instant flag.",
    tag: "visibility",
  },
  {
    Icon: Activity,
    label: "Focus tracking",
    note: "window.blur events are logged in real time. Every defocus appears in the post-room integrity report.",
    tag: "focus",
  },
  {
    Icon: Server,
    label: "Sandbox execution",
    note: "Judge0 isolated containers run every submission. 5s timeout, 128MB RAM hard cap — no exceptions.",
    tag: "runtime",
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

      <div className="max-w-[1100px] mx-auto relative">
        {/* Two-column layout: left text, right specifics */}
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 mb-24">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="font-zen-dots text-[clamp(1.9rem,4.5vw,3.4rem)] text-haze leading-[1.1] mb-8">
              AI sets the stage.{" "}
              <span style={{ color: "var(--void)" }}>You claim the crown.</span>
            </h2>
            <p className="font-rajdhani text-lg md:text-xl text-haze-2 leading-relaxed mb-5">
              The AI engine is a creation assistant, not a referee. It reads raw task briefs, structures the details, and sets up test cases.
            </p>
            <p className="font-rajdhani text-base text-haze-3 leading-relaxed">
              Before any lobby goes live, the room creator has full editing control over the title, difficulty, and test cases — preventing hallucinations and guaranteeing fair play. The actual winner is always decided by a deterministic system.
            </p>
          </motion.div>

          {/* Quick-spec list */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.65, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col justify-center"
          >
            {[
              { label: "Task classification", value: "4 formats · AI-assigned" },
              { label: "Difficulty rating",   value: "Recruit → Legendary" },
              { label: "Test case generation", value: "5 public · 20 hidden" },
              { label: "Edit window",          value: "Full control before publish" },
              { label: "Judgment engine",      value: "Deterministic · Server-side" },
              { label: "Submission timeout",   value: "5 s · 128 MB RAM cap" },
            ].map((row, i) => (
              <motion.div
                key={row.label}
                initial={{ opacity: 0, x: 16 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.18 + i * 0.055 }}
                className="flex items-baseline justify-between py-4"
                style={{ borderBottom: "1px solid var(--border-1)" }}
              >
                <span className="font-rajdhani text-base text-haze-3">{row.label}</span>
                <span className="font-space-mono text-[11px] text-haze-2 text-right tabular-nums">{row.value}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Anti-cheat section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex items-center gap-4 mb-8 pb-4" style={{ borderBottom: "1px solid var(--border-1)" }}>
            <h3 className="font-zen-dots text-xl text-haze">Anti-cheat</h3>
            <span
              className="font-space-mono text-[9px] tracking-[2px] uppercase px-2 py-1 rounded-sm"
              style={{ background: "var(--void-tint)", color: "var(--void)", border: "1px solid var(--border-accent)" }}
            >
              Active in every session
            </span>
          </div>

          <div className="divide-y" style={{ borderTop: "1px solid var(--border-1)" }}>
            {ANTI_CHEAT.map((ac, i) => (
              <motion.div
                key={ac.label}
                initial={{ opacity: 0, y: 12 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.45, delay: 0.4 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-[auto_1fr] sm:grid-cols-[40px_200px_1fr] items-start sm:items-center gap-4 sm:gap-8 py-5"
                style={{ borderColor: "var(--border-1)" }}
              >
                <div
                  className="w-8 h-8 rounded-sm flex items-center justify-center shrink-0"
                  style={{ background: "var(--void-tint)", border: "1px solid var(--border-accent)" }}
                >
                  <ac.Icon size={15} style={{ color: "var(--void)" }} aria-hidden />
                </div>
                <span className="font-space-mono text-[11px] tracking-[1px] uppercase text-haze-2 col-span-1 sm:col-auto pt-1 sm:pt-0">
                  {ac.label}
                </span>
                <p className="font-rajdhani text-[15px] text-haze-3 leading-relaxed col-span-2 sm:col-auto pl-12 sm:pl-0">
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
