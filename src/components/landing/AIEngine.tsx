"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Accent, LandingSection, SectionHeading, SectionIntro, SpecLine } from "@/components/landing/_section";
import { Shield, Eye, Monitor, Box } from "lucide-react";

const ANTI_CHEAT = [
  {
    icon: Shield,
    label: "Paste blocked",
    note: "Clipboard paste is disabled for the full live arena — coding and trivia.",
  },
  {
    icon: Eye,
    label: "Tab monitoring",
    note: "Leaving the arena tab disqualifies you instantly — no second chances.",
  },
  {
    icon: Monitor,
    label: "Split view & side panels",
    note: "Chrome split view, AI sidebars, and right-click assistant panels are detected — with a warning before removal.",
  },
  {
    icon: Box,
    label: "Sandbox execution",
    note: "Every submission runs in an isolated container. 5s timeout, 128MB RAM cap.",
  },
] as const;

export function AIEngine() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });

  return (
    <LandingSection className="pt-20 md:pt-28">
      <div ref={ref} className="relative w-full flex flex-col items-center">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 55% 55% at 50% 20%, var(--glow-1), transparent)" }}
          aria-hidden
        />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl mx-auto text-center mb-20 md:mb-28"
        >
          <SpecLine>The engine</SpecLine>
          <SectionHeading className="mt-5 md:mt-6 mb-6 md:mb-8">
            AI sets the stage. <Accent>You claim the crown.</Accent>
          </SectionHeading>
          <p className="font-rajdhani text-lg md:text-xl text-haze-2 leading-relaxed mb-5 max-w-[58ch] mx-auto">
            The AI engine is a creation assistant, not a referee. It reads raw task briefs, structures the details, and sets up test cases.
          </p>
          <p className="font-rajdhani text-base text-haze-3 leading-relaxed max-w-[58ch] mx-auto">
            Before any lobby goes live, the room creator has full editing control over the title, difficulty, and test cases. The winner is always decided by a deterministic system.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex flex-wrap items-center justify-center gap-4 mb-10 md:mb-12 text-center">
            <h3 className="font-zen-dots text-2xl md:text-3xl text-haze">Anti-cheat</h3>
            <span
              className="font-space-mono text-[9px] tracking-[2px] uppercase px-2.5 py-1 rounded-sm text-void"
              style={{ background: "var(--void-tint)", border: "1px solid var(--border-accent)" }}
            >
              Active in every session
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto w-full">
            {ANTI_CHEAT.map((ac, i) => {
              const Icon = ac.icon;
              return (
                <motion.div
                  key={ac.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.45, delay: 0.3 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col items-center text-center gap-4 p-8 md:p-10 rounded-xl"
                  style={{
                    background: "var(--cosmos-2)",
                    border: "1px solid var(--border-1)",
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ background: "var(--void-tint)", border: "1px solid var(--border-accent)" }}
                  >
                    <Icon size={20} className="text-void" aria-hidden />
                  </div>
                  <p className="font-space-mono text-sm tracking-[1px] uppercase text-void">
                    {ac.label}
                  </p>
                  <p className="font-rajdhani text-base md:text-[17px] text-haze-2 leading-relaxed max-w-[40ch]">
                    {ac.note}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </LandingSection>
  );
}
