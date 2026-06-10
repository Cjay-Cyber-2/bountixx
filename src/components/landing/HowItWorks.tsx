"use client";

import { useRef } from "react";
import { motion, useInView, useScroll, useTransform, useReducedMotion } from "framer-motion";

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

  // The vertical rail fills as the user scrolls through the three stages:
  // motion as storytelling, progress through the flow
  const { scrollYProgress } = useScroll({
    target: railRef,
    offset: ["start 70%", "end 55%"],
  });
  const railFill = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section
      id="how-it-works"
      className="relative py-32 md:py-44 px-6 lg:px-14 bg-cosmos overflow-hidden"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(circle 900px at 50% -100px, var(--glow-1), transparent)" }}
        aria-hidden
      />

      <div className="max-w-[1100px] mx-auto relative">
        {/* Header */}
        <div className="mb-20 md:mb-28">
          <h2 className="font-zen-dots text-[clamp(1.9rem,4.5vw,3.4rem)] text-haze leading-[1.1] text-balance">
            How the Arena Works
          </h2>
          <p className="font-rajdhani text-lg text-haze-2 mt-4 max-w-md leading-relaxed">
            Three stages. Thirty seconds between you and your rivals.
          </p>
        </div>

        {/* Numbered flow with a filling rail */}
        <div ref={railRef} className="relative">
          {/* Rail track */}
          <div
            className="absolute left-[27px] md:left-[43px] top-2 bottom-2 w-px hidden sm:block"
            style={{ background: "var(--border-1)" }}
            aria-hidden
          />
          {/* Rail fill */}
          {!reduce && (
            <motion.div
              className="absolute left-[27px] md:left-[43px] top-2 w-px hidden sm:block origin-top"
              style={{ height: railFill, background: "var(--void)" }}
              aria-hidden
            />
          )}

          <div className="flex flex-col gap-20 md:gap-28">
            {STEPS.map((step, i) => (
              <Stage key={step.num} step={step} flip={i % 2 === 1} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Stage({
  step,
  flip,
}: {
  step: (typeof STEPS)[number];
  flip: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20% 0px" });

  return (
    <div ref={ref} className="relative sm:pl-24 md:pl-36">
      {/* Node on the rail */}
      <motion.span
        initial={{ scale: 0 }}
        animate={inView ? { scale: 1 } : {}}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.15 }}
        className="absolute left-[21px] md:left-[37px] top-6 w-[13px] h-[13px] rounded-full hidden sm:block"
        style={{ background: "var(--cosmos)", border: "2px solid var(--void)" }}
        aria-hidden
      />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className={`flex flex-col md:flex-row md:items-baseline gap-4 md:gap-12 ${flip ? "md:flex-row-reverse md:text-right" : ""}`}
      >
        {/* Ghost numeral, the stage's anchor */}
        <span
          className="font-orbitron font-black leading-none select-none shrink-0 tabular-nums"
          style={{
            fontSize: "clamp(4rem, 9vw, 7.5rem)",
            color: "transparent",
            WebkitTextStroke: "1.5px var(--border-2)",
          }}
          aria-hidden
        >
          {step.num}
        </span>

        <div className={`max-w-[52ch] ${flip ? "md:ml-auto" : ""}`}>
          <h3 className="font-zen-dots text-xl md:text-2xl text-haze mb-4">
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
