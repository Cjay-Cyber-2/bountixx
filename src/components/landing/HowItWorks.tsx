"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { LandingSection, SectionIntro } from "@/components/landing/_section";

const STEPS = [
  {
    num: "01",
    title: "Drop the challenge",
    body: "Paste any task — the AI classifies it, sets difficulty, and generates test cases in seconds.",
  },
  {
    num: "02",
    title: "Lock the arena",
    body: "Invite rivals. Once slots fill, a 30-second ready check fires. Everyone enters simultaneously.",
  },
  {
    num: "03",
    title: "Claim the bounty",
    body: "Solve it first. The deterministic engine validates submissions server-side to the millisecond.",
  },
] as const;

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });

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
        description="Thirty seconds stand between you and your rivals."
        className="relative z-[1]"
      />

      <motion.div
        ref={ref}
        initial="hidden"
        animate={inView ? "show" : "hidden"}
        variants={{ show: { transition: { staggerChildren: 0.12 } } }}
        className="relative z-[1] grid md:grid-cols-3 gap-6 md:gap-8 lg:gap-10"
      >
        {STEPS.map((step, i) => (
          <motion.div
            key={step.num}
            variants={{
              hidden: { opacity: 0, y: 28 },
              show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
            }}
            className="group relative p-8 md:p-10 lg:p-12 transition-transform duration-300 hover:-translate-y-1"
            style={{
              background: "var(--cosmos-2)",
              border: "1px solid var(--border-1)",
              borderTop: "2px solid var(--void)",
            }}
          >
            {/* Hover glow */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{ background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(168,85,247,0.08), transparent 70%)" }}
              aria-hidden
            />

            {/* Large step number */}
            <span
              className="font-orbitron font-black leading-none select-none tabular-nums block mb-6"
              style={{
                fontSize: "clamp(3rem, 5vw, 4.5rem)",
                color: "transparent",
                WebkitTextStroke: "1.5px var(--border-2)",
              }}
              aria-hidden
            >
              {step.num}
            </span>

            <h3 className="font-zen-dots text-lg md:text-xl text-haze mb-3 leading-tight">
              {step.title}
            </h3>
            <p className="font-rajdhani text-base text-haze-2 leading-relaxed">
              {step.body}
            </p>

            {/* Connector line between cards (hidden on mobile & last card) */}
            {i < STEPS.length - 1 && (
              <span
                className="hidden md:block absolute top-1/2 -right-[calc(theme(gap.8)/2+1px)] lg:-right-[calc(theme(gap.10)/2+1px)] w-4 h-px"
                style={{ background: "var(--border-2)" }}
                aria-hidden
              />
            )}
          </motion.div>
        ))}
      </motion.div>
    </LandingSection>
  );
}
