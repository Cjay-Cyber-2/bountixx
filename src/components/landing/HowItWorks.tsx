"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = [
  {
    num: "01",
    title: "Drop the challenge",
    body: "Paste any task. The AI engine classifies it, titles it, sets difficulty, and structures test cases in seconds.",
    visualType: "create",
  },
  {
    num: "02",
    title: "Lock the arena",
    body: "Invite your rivals. Once slots are filled, a 30-second ready check begins. Everyone enters simultaneously.",
    visualType: "lobby",
  },
  {
    num: "03",
    title: "Claim the bounty",
    body: "Solve it first. The deterministic judgment engine validates submissions server-side to the millisecond.",
    visualType: "reward",
  },
] as const;

const PROGRESS_DURATION = 5000;

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(Date.now());

  function startCycle() {
    startRef.current = Date.now();
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const p = Math.min(elapsed / PROGRESS_DURATION, 1);
      setProgress(p);
      if (p >= 1) {
        setActiveStep((prev) => (prev + 1) % STEPS.length);
        startRef.current = Date.now();
        setProgress(0);
      }
    }, 30);
  }

  useEffect(() => {
    startCycle();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSelect(idx: number) {
    setActiveStep(idx);
    setProgress(0);
    startRef.current = Date.now();
  }

  return (
    <section
      id="how-it-works"
      ref={containerRef}
      className="relative py-32 md:py-44 px-6 lg:px-14 bg-cosmos overflow-hidden"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(circle 900px at 50% -100px, var(--glow-1), transparent)" }}
        aria-hidden
      />

      <div className="max-w-[1200px] mx-auto relative">
        {/* Header */}
        <div className="mb-16 md:mb-20">
          <h2 className="font-zen-dots text-[clamp(1.9rem,4.5vw,3.4rem)] text-haze leading-[1.1]">
            How the Arena Works
          </h2>
          <p className="font-rajdhani text-lg text-haze-2 mt-4 max-w-md leading-relaxed">
            Three stages. Thirty seconds between you and your rivals.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-20 items-center">

          {/* Left: Step selectors */}
          <div className="flex flex-col gap-0 border-t border-b" style={{ borderColor: "var(--border-1)" }}>
            {STEPS.map((step, idx) => {
              const isActive = activeStep === idx;
              return (
                <button
                  key={step.num}
                  onClick={() => handleSelect(idx)}
                  className="group relative text-left py-7 px-6 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-void/50"
                  style={{
                    background: isActive ? "var(--surface-card)" : "transparent",
                    borderBottom: `1px solid var(--border-1)`,
                  }}
                  aria-pressed={isActive}
                >
                  {/* Progress bar at bottom of active card */}
                  {isActive && (
                    <motion.div
                      className="absolute bottom-0 left-0 h-[2px]"
                      style={{ background: "var(--void)", width: `${progress * 100}%` }}
                      aria-hidden
                    />
                  )}

                  <div className="flex items-baseline gap-5 mb-3">
                    <span
                      className="font-orbitron font-black text-[2.2rem] leading-none tabular-nums select-none transition-colors duration-300"
                      style={{ color: isActive ? "var(--void)" : "var(--border-1)" }}
                      aria-hidden
                    >
                      {step.num}
                    </span>
                    <h3
                      className="font-zen-dots text-lg md:text-xl transition-colors duration-300"
                      style={{ color: isActive ? "var(--haze)" : "var(--haze-3)" }}
                    >
                      {step.title}
                    </h3>
                  </div>

                  <p
                    className="font-rajdhani text-base md:text-[17px] leading-relaxed max-w-[46ch] pl-[4.5rem] transition-colors duration-300"
                    style={{ color: isActive ? "var(--haze-2)" : "var(--haze-3)", opacity: isActive ? 1 : 0.55 }}
                  >
                    {step.body}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Right: Simulated terminal mockup */}
          <div className="relative flex items-center justify-center">
            <div
              className="w-full max-w-[420px] rounded-sm overflow-hidden flex flex-col"
              style={{
                background: "var(--terminal-bg)",
                border: "1px solid var(--terminal-border)",
                boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(155,107,255,0.06)",
              }}
            >
              {/* Title bar */}
              <div
                className="h-10 px-4 flex items-center justify-between shrink-0"
                style={{ borderBottom: "1px solid var(--terminal-border)", background: "rgba(0,0,0,0.25)" }}
              >
                <div className="flex gap-1.5" aria-hidden>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(255,107,26,0.5)" }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(240,165,0,0.5)" }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(0,214,143,0.35)" }} />
                </div>
                <span className="font-space-mono text-[9px] tracking-[2px] uppercase" style={{ color: "rgba(155,107,255,0.5)" }}>
                  arena.sys
                </span>
                <span className="font-space-mono text-[9px]" style={{ color: "rgba(155,107,255,0.35)" }}>
                  v1.0
                </span>
              </div>

              <div className="flex-1 min-h-[280px] p-6 font-space-mono text-xs flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  {activeStep === 0 && (
                    <motion.div
                      key="create-visual"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-4"
                    >
                      <div style={{ color: "rgba(155,107,255,0.5)" }}>{"$ parse --task input_text"}</div>
                      <div style={{ color: "#a855f7" }} className="animate-pulse">{"▸ classifying..."}</div>

                      <div
                        className="space-y-2.5 p-4 rounded-sm"
                        style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(155,107,255,0.12)" }}
                      >
                        {[
                          { k: "class", v: "CODING", c: "#00D68F" },
                          { k: "title", v: "String Reversal Clash", c: "#E8E0FF" },
                          { k: "diff",  v: "ELITE",  c: "#F0A500" },
                          { k: "tests", v: "5 public · 20 hidden", c: "#00D68F" },
                        ].map((row) => (
                          <div key={row.k} className="flex justify-between gap-4">
                            <span style={{ color: "rgba(155,107,255,0.5)" }}>{row.k}</span>
                            <span style={{ color: row.c }}>{row.v}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ color: "#00D68F" }} className="text-[11px]">✓ Arena ready.</div>
                    </motion.div>
                  )}

                  {activeStep === 1 && (
                    <motion.div
                      key="lobby-visual"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-4"
                    >
                      <div style={{ color: "rgba(155,107,255,0.5)" }}>{"$ lobby.headcount()"}</div>

                      <div>
                        <div
                          className="flex items-center justify-between pb-2 mb-3"
                          style={{ borderBottom: "1px solid rgba(155,107,255,0.15)" }}
                        >
                          <span style={{ color: "rgba(232,224,255,0.7)" }}>Gladiators</span>
                          <span style={{ color: "rgba(155,107,255,0.6)" }}>4 / 4 Slots</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          {["cyber_ghost", "zero_cool", "acid_burn", "neo_matrix"].map((name) => (
                            <div
                              key={name}
                              className="flex justify-between items-center px-3 py-2 rounded-sm"
                              style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(155,107,255,0.1)" }}
                            >
                              <span style={{ color: "rgba(232,224,255,0.7)" }}>{name}</span>
                              <span style={{ color: "#00D68F" }}>READY</span>
                            </div>
                          ))}
                        </div>
                        <div className="text-center mt-4 text-[11px] animate-pulse" style={{ color: "#F0A500" }}>
                          ⏱ Starting in 05s…
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeStep === 2 && (
                    <motion.div
                      key="reward-visual"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-5"
                    >
                      <div style={{ color: "rgba(155,107,255,0.5)" }}>{"$ arena.winner_declared()"}</div>

                      <div
                        className="inline-flex px-3 py-1 text-[10px] tracking-[2px] uppercase rounded-sm"
                        style={{ background: "rgba(0,214,143,0.1)", border: "1px solid rgba(0,214,143,0.25)", color: "#00D68F" }}
                      >
                        Victory declared
                      </div>

                      <div className="py-1">
                        <div className="text-[10px] uppercase mb-1" style={{ color: "rgba(155,107,255,0.5)" }}>Winner</div>
                        <div className="font-zen-dots text-lg text-white">cyber_ghost</div>
                        <div className="text-[10px] mt-1" style={{ color: "rgba(155,107,255,0.5)" }}>submitted in 14.82s</div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { val: "+250 ◈", label: "Coins", color: "#F0A500" },
                          { val: "+200 XP", label: "Experience", color: "#a855f7" },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="p-3 rounded-sm"
                            style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(155,107,255,0.1)" }}
                          >
                            <div className="font-bold text-sm" style={{ color: item.color }}>{item.val}</div>
                            <div className="text-[9px] mt-0.5" style={{ color: "rgba(155,107,255,0.45)" }}>{item.label}</div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
