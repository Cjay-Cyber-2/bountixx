"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Zap, Lock, Trophy } from "lucide-react";
import { staggerContainer, slideUp } from "@/lib/animations";

const steps = [
  {
    num: "01",
    icon: Zap,
    title: "DROP THE CHALLENGE",
    body: "Paste any task — code, trivia, logic, math. AI classifies, titles, and builds the challenge in seconds.",
    color: "var(--ignite)",
  },
  {
    num: "02",
    icon: Lock,
    title: "LOCK THE ARENA",
    body: "Set your player count. Invite rivals. The room seals when everyone is in and all confirm ready.",
    color: "var(--void)",
  },
  {
    num: "03",
    icon: Trophy,
    title: "CLAIM THE BOUNTY",
    body: "First correct submission wins. Coins are awarded instantly. Your rank rises. Legends are made.",
    color: "var(--crown)",
  },
];

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });

  return (
    <section id="how-it-works" className="py-36 px-6 lg:px-14 bg-cosmos" ref={ref}>
      <div className="max-w-[1400px] mx-auto">
      {/* Heading */}
      <div className="mb-16 relative">
        <p className="font-share-mono text-xs text-ignite tracking-[6px] mb-3 uppercase">
          How It Works
        </p>
        <h2 className="font-orbitron font-bold text-4xl lg:text-5xl text-haze">
          HOW THE ARENA WORKS
        </h2>
        {/* Animated underline */}
        <motion.div
          className="h-[3px] bg-ignite mt-4"
          initial={{ width: 0 }}
          animate={inView ? { width: "100%" } : { width: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          style={{ maxWidth: 480 }}
        />
      </div>

      {/* Steps */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate={inView ? "show" : "hidden"}
        className="relative grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.num}
              variants={slideUp}
              className="relative group bg-cosmos-2 p-10 clip-arena border-l-[3px] overflow-hidden hover:border-l-4 transition-all"
              style={{ borderColor: step.color }}
            >
              {/* Background step number */}
              <span
                className="absolute top-6 right-8 font-orbitron font-black text-8xl select-none pointer-events-none"
                style={{ color: `${step.color}12` }}
                aria-hidden="true"
              >
                {step.num}
              </span>

              <div
                className="w-14 h-14 flex items-center justify-center mb-8"
                style={{ background: `${step.color}15`, borderRadius: 4 }}
              >
                <Icon size={28} style={{ color: step.color }} aria-hidden="true" />
              </div>

              <h3 className="font-orbitron font-bold text-xl text-haze mb-4 tracking-wide">
                {step.title}
              </h3>
              <p className="font-rajdhani text-lg text-haze-2 leading-relaxed">
                {step.body}
              </p>

              {/* Connecting arrow (not last) */}
              {i < steps.length - 1 && (
                <div
                  className="hidden lg:block absolute -right-4 top-1/2 -translate-y-1/2 z-10"
                  aria-hidden="true"
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12H19M13 6l6 6-6 6" stroke="var(--ignite)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
                  </svg>
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>
      </div>
    </section>
  );
}
