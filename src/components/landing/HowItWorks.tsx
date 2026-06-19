"use client";

import { useRef } from "react";
import { motion, useInView, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { LandingSection, LANDING_STEP_STACK, LANDING_SURFACE, SectionIntro } from "@/components/landing/_section";

const STEPS = [
  {
    num: "01",
    title: "Drop the challenge",
    body: "Paste any task. The AI engine classifies it, titles it, sets difficulty, and structures test cases in seconds.",
  },
  {
    num: "02",
    title: "Lock the arena",
    body: "Invite your rivals. Once slots are filled, a 30-second ready check begins. Everyone enters simultaneously.",
  },
  {
    num: "03",
    title: "Claim the bounty",
    body: "Solve it first. The deterministic judgment engine validates submissions server-side to the millisecond.",
  },
] as const;

/** Left-rail x offset — dots and line share this anchor */
const RAIL_LEFT = "clamp(1.75rem, 8vw, 4.5rem)";

export function HowItWorks() {
  const railRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: railRef,
    offset: ["start 75%", "end 45%"],
  });
  const railFill = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <LandingSection id="how-it-works" className="relative">
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{ background: "radial-gradient(circle 900px at 50% -100px, var(--glow-1), transparent)" }}
        aria-hidden
      />

      <SectionIntro
        eyebrow="Three stages"
        title="How the Arena Works"
        description="Thirty seconds stand between you and your rivals. Here is the run of play."
        className="relative z-[1]"
      />

      <div ref={railRef} className="relative z-[1] w-full">
        <div
          className="absolute top-0 bottom-0 w-px pointer-events-none"
          style={{ left: RAIL_LEFT }}
          aria-hidden
        >
          <div className="absolute inset-0 w-px" style={{ background: "var(--border-1)" }} />
          {!reduce && (
            <motion.div
              className="absolute top-0 left-0 w-px origin-top"
              style={{ height: railFill, background: "var(--brand-primary)" }}
            />
          )}
        </div>

        <div className={LANDING_STEP_STACK}>
          {STEPS.map((step, i) => (
            <Stage key={step.num} step={step} isLast={i === STEPS.length - 1} />
          ))}
        </div>
      </div>
    </LandingSection>
  );
}

function Stage({ step, isLast = false }: { step: (typeof STEPS)[number]; isLast?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-18% 0px" });

  return (
    <div ref={ref} className={`relative w-full ${isLast ? "mb-4 md:mb-8" : ""}`}>
      <motion.span
        initial={{ scale: 0 }}
        animate={inView ? { scale: 1 } : {}}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
        className="absolute z-[2] flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full"
        style={{
          left: RAIL_LEFT,
          top: "1.25rem",
          background: "var(--cosmos)",
          border: "2px solid var(--void)",
          boxShadow: "0 0 12px var(--glow-1)",
        }}
        aria-hidden
      />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="flex w-full flex-col items-center text-center"
      >
        <div
          className={`${LANDING_SURFACE} landing-copy-stack w-full max-w-2xl rounded-2xl border-2 border-[var(--border-1)] bg-[var(--cosmos-2)]`}
        >
          <span
            className="font-orbitron font-black leading-none select-none tabular-nums block"
            style={{
              fontSize: "clamp(3rem, 7vw, 5.5rem)",
              color: "transparent",
              WebkitTextStroke: "1.5px var(--border-2)",
            }}
            aria-hidden
          >
            {step.num}
          </span>

          <div className="landing-copy-stack max-w-[48ch] mx-auto w-full">
            <h3 className="font-zen-dots text-lg sm:text-xl md:text-2xl text-haze">
              {step.title}
            </h3>
            <p className="font-rajdhani text-base md:text-lg text-haze-2 leading-[1.85]">
              {step.body}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
