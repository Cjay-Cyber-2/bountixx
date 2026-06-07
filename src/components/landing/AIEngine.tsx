"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const PIPELINE = [
  { k: "Validity Check", v: "Checks if task is real & solvable", ok: "VALID / INVALID" },
  { k: "Classification", v: "Coding · Trivia · Logic · Math", ok: "AUTO" },
  { k: "Title Generator", v: "Generates punchy room names", ok: "GENERATED" },
  { k: "Difficulty", v: "Rookie · Challenger · Elite · Legendary", ok: "RATED" },
  { k: "Test Suite", v: "5 public tests + 20 hidden tests", ok: "SEALED" },
  { k: "Starter Code", v: "Function skeletons (JS, Python)", ok: "BUILT" },
] as const;

const ANTI_CHEAT = [
  { label: "Paste Blocked", note: "onpaste event blocked & Clipboard API intercepted." },
  { label: "Tab Monitoring", note: "document.visibilitychange API flags. 3 strikes notify admin." },
  { label: "Focus Tracking", note: "window.blur event logs window defocus to post-room report." },
  { label: "Sandbox Execution", note: "Judge0 isolated containers. 5s timeout, 128MB RAM limits." },
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
            "radial-gradient(ellipse 50% 50% at 75% 20%, rgba(155,107,255,0.06) 0%, transparent 70%)",
        }}
        aria-hidden
      />

      <div className="max-w-[1280px] mx-auto relative grid lg:grid-cols-2 gap-20 lg:gap-32 items-start">
        {/* Left Side: Text and System Specs */}
        <div>
          <p className="font-space-mono text-[10px] tracking-[5px] uppercase text-[#a855f7] mb-5">
            System Specs
          </p>
          <h2 className="font-zen-dots text-[clamp(2.2rem,5vw,3.8rem)] text-haze leading-[1.08] mb-10">
            AI Builds it.{" "}
            <br className="hidden md:inline" />
            <span
              style={{
                background: "linear-gradient(110deg,#a855f7 0%,#c084fc 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Math decides it.
            </span>
          </h2>

          <div className="space-y-6 mb-12">
            <p className="font-rajdhani text-lg md:text-xl text-haze-2 leading-relaxed">
              The AI engine is a creation assistant, not a referee. It reads raw task briefs, structures the details, and sets up test cases. The actual winner is always determined by a deterministic system.
            </p>
            <p className="font-rajdhani text-base text-haze-3 leading-relaxed">
              Before the lobby goes live, the room creator (admin) has full editing capabilities over the title, difficulty, and code test cases. This prevents hallucination issues and guarantees control.
            </p>
          </div>

          {/* Anti-cheat table */}
          <div>
            <p className="font-space-mono text-[10px] tracking-[4px] uppercase text-haze-3 mb-6 pb-4 border-b border-cosmos-4">
              Anti-Cheat & Sandbox
            </p>
            <div className="divide-y divide-cosmos-4">
              {ANTI_CHEAT.map((ac, i) => (
                <motion.div
                  key={ac.label}
                  initial={{ opacity: 0, x: -12 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.15 + i * 0.08 }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between py-5 gap-2"
                >
                  <p className="font-space-mono text-xs text-haze-2 tracking-[1px] uppercase">
                    {ac.label}
                  </p>
                  <p className="font-rajdhani text-[14px] text-haze-3 max-w-sm sm:text-right">
                    {ac.note}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Large spacious terminal preview */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-lg w-full"
          style={{
            background: "linear-gradient(160deg, rgba(19,12,36,0.98), rgba(14,8,24,0.98))",
            border: "1px solid rgba(155,107,255,0.15)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-2 px-6 py-4 border-b border-cosmos-4 justify-between"
            style={{ background: "rgba(14,8,24,0.6)" }}
          >
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-haze-3/30" />
              <span className="w-2.5 h-2.5 rounded-full bg-haze-3/30" />
              <span className="w-2.5 h-2.5 rounded-full bg-haze-3/30" />
            </div>
            <span className="font-space-mono text-[9px] text-haze-3 tracking-[3px] uppercase">
              analyzer.logs
            </span>
          </div>

          {/* Table body */}
          <div className="p-8 md:p-10 space-y-4">
            {PIPELINE.map((row, i) => (
              <motion.div
                key={row.k}
                initial={{ opacity: 0, x: -10 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
                className="flex items-center justify-between gap-6 font-space-mono text-[12px] md:text-[13px] py-1"
              >
                <span className="flex items-center gap-3 min-w-0">
                  <span className="text-[#a855f7] select-none">▸</span>
                  <span className="text-haze-3 w-[120px] shrink-0 font-bold">{row.k}</span>
                  <span className="text-haze-2/70 truncate hidden sm:inline">{row.v}</span>
                </span>
                <span
                  className="shrink-0 px-3 py-1 text-[10px] tracking-[2px] font-space-mono text-[#00D68F]"
                  style={{
                    background: "rgba(0,214,143,0.06)",
                    border: "1px solid rgba(0,214,143,0.15)",
                  }}
                >
                  {row.ok}
                </span>
              </motion.div>
            ))}

            {/* Bottom Status line */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.95 }}
              className="flex items-center gap-3 pt-6 mt-4 border-t border-cosmos-4 font-space-mono text-[12px]"
            >
              <span className="text-[#00D68F]">✓</span>
              <span className="text-haze-2">AI normalisation complete</span>
              <span className="text-haze-3 ml-auto hidden sm:inline">— waiting for admin review</span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
