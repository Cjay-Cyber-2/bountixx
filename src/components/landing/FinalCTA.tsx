"use client";

import type React from "react";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function FinalCTA() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-8% 0px" });

  return (
    <section
      ref={ref}
      className="cyber-grid relative py-32 md:py-40 px-6 sm:px-10 lg:px-16 bg-cosmos overflow-hidden text-center"
    >
      {/* Atmospheric glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background: "radial-gradient(ellipse 65% 55% at 50% 45%, rgba(168,85,247,0.09), transparent 70%)",
        }}
      />

      {/* Top rule */}
      <span
        aria-hidden
        className="absolute top-0 left-6 right-6 lg:left-14 lg:right-14 h-px"
        style={{
          background: "linear-gradient(90deg, transparent, var(--border-2) 40%, var(--border-2) 60%, transparent)",
        }}
      />

      <div className="max-w-2xl mx-auto relative">
        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 36 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="font-zen-dots text-[clamp(2.4rem,6vw,4.5rem)] text-haze mb-6 leading-[1.04]"
        >
          Ready to enter{" "}
          <span style={{ color: "var(--void)" }}>the arena?</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.12 }}
          className="font-rajdhani text-lg text-haze-2 mb-12 max-w-md mx-auto leading-relaxed"
        >
          No subscription. No card required. Your first 10 arenas are free. The AI structures the challenge, you bring the skill.
        </motion.p>

        {/* CTAs */}
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

        {/* Trust strip — horizontal, not stacked bullets */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
          className="mt-14 font-space-mono text-[10px] text-haze-3 tracking-[3px] uppercase"
        >
          No subscription · Anti-cheat AI · Coins land instantly
        </motion.p>
      </div>
    </section>
  );
}
