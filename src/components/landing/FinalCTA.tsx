"use client";

import type React from "react";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Accent, LANDING_GUTTERS } from "@/components/landing/_section";

export function FinalCTA() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-8% 0px" });

  return (
    <section
      ref={ref}
      className="cyber-grid relative py-28 md:py-36 lg:py-40 bg-cosmos overflow-hidden text-center"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background: "radial-gradient(ellipse 65% 55% at 50% 45%, rgba(168,85,247,0.09), transparent 70%)",
        }}
      />

      <span
        aria-hidden
        className="absolute top-0 left-6 right-6 md:left-12 md:right-12 lg:left-16 lg:right-16 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--border-2) 40%, var(--border-2) 60%, transparent)",
        }}
      />

      <div className={`${LANDING_GUTTERS} relative`}>
        <div className="w-full max-w-3xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 36 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="font-zen-dots text-[clamp(2.2rem,5.5vw,4rem)] text-haze mb-6 md:mb-8 leading-[1.08] text-balance"
        >
          Ready to enter <Accent>the arena?</Accent>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.12 }}
          className="font-rajdhani text-lg md:text-xl text-haze-2 mb-10 md:mb-12 mx-auto max-w-lg leading-relaxed"
        >
          No subscription. No card required. Start with 500 welcome coins. The AI structures the challenge, you bring the skill.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, delay: 0.25 }}
          className="flex flex-col items-center gap-5 w-full"
        >
          <Link href="/signup" className="block w-full sm:w-auto">
            <Button
              variant="primary"
              size="lg"
              magnetic
              className="w-full sm:w-auto text-base px-12 h-[56px] gap-3 group justify-center"
              style={{
                background: "var(--void)",
                borderColor: "var(--void)",
                boxShadow: "0 0 48px rgba(168,85,247,0.30)",
              } as React.CSSProperties}
            >
              Create your first arena
              <ArrowRight size={16} aria-hidden className="transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>

          <Link
            href="/login"
            className="cursor-target font-space-mono text-[11px] text-haze-2 hover:text-haze transition-colors tracking-[2px] uppercase"
          >
            Already competing? Sign in →
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
          className="mt-12 md:mt-14 font-space-mono text-[10px] text-haze-3 tracking-[3px] uppercase"
        >
          No subscription · Anti-cheat AI · Coins land instantly
        </motion.p>
        </div>
      </div>
    </section>
  );
}
