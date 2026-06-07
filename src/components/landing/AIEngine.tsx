"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Shield, Eye, Activity, Server } from "lucide-react";

const ANTI_CHEAT = [
  {
    Icon: Shield,
    label: "Paste Blocked",
    note: "onpaste intercepted. Clipboard API calls are silently suppressed for the duration of every session.",
  },
  {
    Icon: Eye,
    label: "Tab Monitoring",
    note: "document.visibilitychange tracks every exit. Three strikes and the admin receives an instant flag.",
  },
  {
    Icon: Activity,
    label: "Focus Tracking",
    note: "window.blur events are logged in real time. Every defocus appears in the post-room integrity report.",
  },
  {
    Icon: Server,
    label: "Sandbox Execution",
    note: "Judge0 isolated containers run every submission. 5s timeout, 128MB RAM hard cap — no exceptions.",
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
      {/* Background radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 55% 55% at 50% 20%, rgba(155,107,255,0.07) 0%, transparent 70%)",
        }}
        aria-hidden
      />

      <div className="max-w-[860px] mx-auto relative text-center">
        {/* Section label */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="font-space-mono text-[10px] tracking-[5px] uppercase text-[#a855f7] mb-5"
        >
          System Specs
        </motion.p>

        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 28 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="font-zen-dots text-[clamp(2.2rem,5vw,3.8rem)] text-haze leading-[1.08] mb-10"
        >
          AI sets the stage.{" "}
          <br className="hidden md:inline" />
          <span
            style={{
              background: "linear-gradient(110deg,#a855f7 0%,#c084fc 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            You claim the crown.
          </span>
        </motion.h2>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="space-y-4 mb-20 max-w-xl mx-auto"
        >
          <p className="font-rajdhani text-lg md:text-xl text-haze-2 leading-relaxed">
            The AI engine is a creation assistant, not a referee. It reads raw task briefs,
            structures the details, and sets up test cases. The actual winner is always decided
            by a deterministic system.
          </p>
          <p className="font-rajdhani text-base text-haze-3 leading-relaxed">
            Before any lobby goes live, the room creator has full editing control over the
            title, difficulty, and test cases — preventing hallucinations and guaranteeing
            fair play.
          </p>
        </motion.div>

        {/* Anti-cheat label */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.3 }}
          className="font-space-mono text-[10px] tracking-[4px] uppercase text-haze-3 mb-10"
        >
          Anti-Cheat & Sandbox
        </motion.p>

        {/* Anti-cheat cards 2×2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {ANTI_CHEAT.map((ac, i) => (
            <motion.div
              key={ac.label}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.35 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center gap-4 p-7 rounded-lg text-center"
              style={{
                background: "rgba(19,12,36,0.55)",
                border: "1px solid rgba(168,85,247,0.18)",
              }}
            >
              {/* Icon */}
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{
                  background: "rgba(168,85,247,0.10)",
                  border: "1px solid rgba(168,85,247,0.22)",
                }}
              >
                <ac.Icon size={18} style={{ color: "#a855f7" }} aria-hidden />
              </div>

              {/* Text */}
              <div>
                <p className="font-space-mono text-[11px] tracking-[2px] uppercase text-haze-2 mb-2">
                  {ac.label}
                </p>
                <p className="font-rajdhani text-[15px] text-haze-3 leading-relaxed">
                  {ac.note}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
