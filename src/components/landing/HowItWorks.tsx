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

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-play the steps animation sequence
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % STEPS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="how-it-works"
      ref={containerRef}
      className="relative py-32 md:py-40 px-6 lg:px-14 bg-cosmos overflow-hidden"
    >
      {/* Background Ambience */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background: "radial-gradient(circle 800px at 50% -200px, rgba(155,107,255,0.08), transparent)",
        }}
        aria-hidden
      />

      <div className="max-w-[1200px] mx-auto relative">
        {/* Top Header */}
        <div className="mb-20 flex items-end justify-between border-b border-cosmos-4 pb-8">
          <div>
            <p className="font-space-mono text-[10px] tracking-[5px] uppercase text-haze-3 mb-2">
              Process
            </p>
            <h2 className="font-zen-dots text-2xl md:text-3xl text-haze">
              How the Arena Works
            </h2>
          </div>
          <p className="hidden md:block font-space-mono text-[10px] tracking-[3px] uppercase text-haze-3">
            01 → 02 → 03
          </p>
        </div>

        {/* Content Split: Left Step list, Right Live Interactive Terminal Visualizer */}
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-20 items-center">
          
          {/* Left: Step selectors */}
          <div className="flex flex-col gap-6">
            {STEPS.map((step, idx) => {
              const isActive = activeStep === idx;
              return (
                <div
                  key={step.num}
                  onClick={() => setActiveStep(idx)}
                  className="cursor-pointer group relative p-6 md:p-8 transition-all duration-300 rounded border border-transparent"
                  style={{
                    background: isActive ? "rgba(19,12,36,0.5)" : "transparent",
                    borderColor: isActive ? "rgba(155,107,255,0.15)" : "transparent",
                  }}
                >
                  {/* Left indicator bar */}
                  <motion.div
                    className="absolute left-0 top-0 bottom-0 w-[3px]"
                    style={{ background: "#9B6BFF" }}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: isActive ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                  />

                  <div className="flex items-baseline gap-4 mb-3">
                    <span
                      className="font-space-mono text-xs font-bold transition-colors duration-300"
                      style={{ color: isActive ? "#9B6BFF" : "var(--haze-3)" }}
                    >
                      {step.num}
                    </span>
                    <h3
                      className="font-zen-dots text-lg md:text-xl transition-colors duration-300"
                      style={{ color: isActive ? "var(--haze)" : "var(--haze-2)" }}
                    >
                      {step.title}
                    </h3>
                  </div>

                  <p
                    className="font-rajdhani text-base md:text-lg transition-colors duration-300 leading-relaxed max-w-[42ch] pl-8"
                    style={{ color: isActive ? "var(--haze-2)" : "rgba(155,107,255,0.4)" }}
                  >
                    {step.body}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Right: Simulated visual terminal mockup */}
          <div className="relative min-h-[380px] flex items-center justify-center">
            <div
              className="w-full max-w-[420px] aspect-[4/3] rounded-lg overflow-hidden relative flex flex-col"
              style={{
                background: "rgba(14,8,24,0.9)",
                border: "1px solid rgba(155,107,255,0.15)",
                boxShadow: "0 24px 60px rgba(0,0,0,0.8)",
              }}
            >
              {/* Top Bar */}
              <div className="h-10 px-4 flex items-center gap-1.5 border-b border-cosmos-4 bg-cosmos-2 justify-between">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-haze-3/30" />
                  <span className="w-2 h-2 rounded-full bg-haze-3/30" />
                  <span className="w-2 h-2 rounded-full bg-haze-3/30" />
                </div>
                <span className="font-space-mono text-[9px] text-haze-3 uppercase tracking-wider">
                  sys.visualizer_v1.0
                </span>
              </div>

              {/* Dynamic content rendering with key transition */}
              <div className="flex-1 p-6 font-space-mono text-xs flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  {activeStep === 0 && (
                    <motion.div
                      key="create-visual"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      <div className="text-haze-3">{"$ parse --task input_text"}</div>
                      <div className="text-[#a855f7] animate-pulse">{"▸ analyzing content..."}</div>
                      
                      <div className="space-y-2 p-3 bg-cosmos-2 border border-cosmos-4">
                        <div className="flex justify-between">
                          <span className="text-haze-3">Class:</span>
                          <span className="text-success">CODING</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-haze-3">Title:</span>
                          <span className="text-haze-2">String Reversal Clash</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-haze-3">Diff:</span>
                          <span className="text-[#F0A500]">ELITE</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-haze-3">Tests:</span>
                          <span className="text-[#00D68F]">5 Pub / 20 Hid</span>
                        </div>
                      </div>
                      <div className="text-success text-[11px]">✓ Arena built successfully.</div>
                    </motion.div>
                  )}

                  {activeStep === 1 && (
                    <motion.div
                      key="lobby-visual"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      <div className="text-haze-3">{"$ lobby.headcount()"}</div>
                      
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-haze-2 pb-1.5 border-b border-cosmos-4">
                          <span>Gladiators Joined</span>
                          <span className="text-haze-3">4 / 4 Slots</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div className="p-2 bg-cosmos-2 border border-cosmos-4 flex justify-between items-center">
                            <span className="text-haze-2">cyber_ghost</span>
                            <span className="text-success">READY</span>
                          </div>
                          <div className="p-2 bg-cosmos-2 border border-cosmos-4 flex justify-between items-center">
                            <span className="text-haze-2">zero_cool</span>
                            <span className="text-success">READY</span>
                          </div>
                          <div className="p-2 bg-cosmos-2 border border-cosmos-4 flex justify-between items-center">
                            <span className="text-haze-2">acid_burn</span>
                            <span className="text-success">READY</span>
                          </div>
                          <div className="p-2 bg-cosmos-2 border border-cosmos-4 flex justify-between items-center">
                            <span className="text-haze-2">neo_matrix</span>
                            <span className="text-success">READY</span>
                          </div>
                        </div>
                        
                        <div className="text-center text-[#F0A500] text-[11px] animate-pulse">
                          ⏱ Starting in 05s...
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeStep === 2 && (
                    <motion.div
                      key="reward-visual"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4 text-center"
                    >
                      <div className="text-haze-3 text-left">{"$ arena.winner_declared()"}</div>
                      
                      <div className="inline-block px-3 py-1 bg-success/10 border border-success/30 text-success text-[10px] tracking-[2px] uppercase">
                        Victory declared
                      </div>
                      
                      <div className="py-2">
                        <div className="text-haze-3 text-[10px] uppercase">Winner</div>
                        <div className="font-zen-dots text-lg text-haze">cyber_ghost</div>
                        <div className="text-haze-3 text-[10px] mt-1">time: 14.82s</div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 max-w-[280px] mx-auto">
                        <div className="p-2 bg-cosmos-2 border border-cosmos-4">
                          <div className="text-[#F0A500] font-bold">+250 ◈</div>
                          <div className="text-[9px] text-haze-3">Coins Awarded</div>
                        </div>
                        <div className="p-2 bg-cosmos-2 border border-cosmos-4">
                          <div className="text-void font-bold">+200 XP</div>
                          <div className="text-[9px] text-haze-3">XP Earned</div>
                        </div>
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
