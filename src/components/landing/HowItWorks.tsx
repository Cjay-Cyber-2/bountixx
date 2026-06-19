"use client";

import { useRef } from "react";
import { motion, useInView, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { LandingSection, SectionIntro } from "@/components/landing/_section";

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

export function HowItWorks() {
  const railRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: railRef,
    offset: ["start 70%", "end 55%"],
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

      <div ref={railRef} className="relative z-[1] max-w-3xl mx-auto">
        <div
          className="absolute left-1/2 -translate-x-1/2 top-2 bottom-2 w-px"
          style={{ background: "var(--border-1)" }}
          aria-hidden
        />
        {!reduce && (
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 top-2 w-px origin-top"
            style={{ height: railFill, background: "var(--brand-primary)" }}
            aria-hidden
          />
        )}

        <div className="flex flex-col gap-20 md:gap-28 lg:gap-32">
          {STEPS.map((step) => (
            <Stage key={step.num} step={step} />
          ))}
        </div>
      </div>
    </LandingSection>
  );
}

function Stage({ step }: { step: (typeof STEPS)[number] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20% 0px" });

  return (
    <div ref={ref} className="relative text-center px-4 md:px-8">
      <motion.span
        initial={{ scale: 0 }}
        animate={inView ? { scale: 1 } : {}}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.15 }}
        className="relative z-[1] mx-auto mb-6 flex h-[13px] w-[13px] items-center justify-center rounded-full"
        style={{ background: "var(--cosmos)", border: "2px solid var(--void)" }}
        aria-hidden
      />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center gap-5 md:gap-6"
      >
        <span
          className="font-orbitron font-black leading-none select-none tabular-nums"
          style={{
            fontSize: "clamp(3.5rem, 8vw, 6.5rem)",
            color: "transparent",
            WebkitTextStroke: "1.5px var(--border-2)",
          }}
          aria-hidden
        >
          {step.num}
        </span>

        <div className="max-w-[52ch]">
          <h3 className="font-zen-dots text-xl md:text-2xl text-haze mb-4 md:mb-5">
            {step.title}
          </h3>
          <p className="font-rajdhani text-base md:text-lg text-haze-2 leading-relaxed">
            {step.body}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
