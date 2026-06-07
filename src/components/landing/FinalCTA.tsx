"use client";

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
      className="relative py-40 px-6 lg:px-14 bg-cosmos overflow-hidden text-center"
    >
      {/* Atmospheric glow — subtle, single color */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 65% 55% at 50% 45%, rgba(168,85,247,0.10) 0%, transparent 70%)",
        }}
      />

      {/* Top horizontal rule */}
      <span
        aria-hidden
        className="absolute top-0 left-6 right-6 lg:left-14 lg:right-14 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(155,107,255,0.4) 40%, rgba(155,107,255,0.4) 60%, transparent)",
        }}
      />

      <div className="max-w-2xl mx-auto relative">
        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="font-space-mono text-[10px] tracking-[5px] uppercase text-haze-3 mb-10"
        >
          First 10 arenas · Free
        </motion.p>

        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 36 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="font-zen-dots text-[clamp(2.4rem,6vw,4.5rem)] text-haze mb-6 leading-[1.04]"
        >
          Ready to enter
          <br />
          <span
            style={{
              background: "linear-gradient(110deg,#a855f7 0%,#c084fc 55%,#e879f9 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            the arena?
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="font-rajdhani text-lg text-haze-2 mb-12 max-w-md mx-auto leading-relaxed"
        >
          No subscription. No card. Just pure competition — and the AI calling every winner.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, delay: 0.3 }}
          className="flex flex-col items-center gap-5"
        >
          <Link href="/signup">
            <Button
              variant="primary"
              size="lg"
              magnetic
              className="text-base px-12 h-[56px] gap-3 group"
              style={{
                background: "#a855f7",
                borderColor: "#a855f7",
                boxShadow: "0 0 48px rgba(168,85,247,0.35)",
              } as React.CSSProperties}
            >
              Create your first arena
              <ArrowRight
                size={16}
                aria-hidden
                className="transition-transform group-hover:translate-x-1"
              />
            </Button>
          </Link>

          <Link
            href="/login"
            className="cursor-target font-space-mono text-[11px] text-haze-3 hover:text-haze-2 transition-colors tracking-[2px] uppercase"
          >
            Already competing? Sign in →
          </Link>
        </motion.div>

        {/* Trust strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-6 mt-14 font-space-mono text-[9px] text-haze-3 tracking-[3px] uppercase"
        >
          {["No subscription", "Anti-cheat AI", "Coins land instantly"].map((item, i) => (
            <span key={item} className="flex items-center gap-3">
              {i > 0 && <span aria-hidden className="w-0.5 h-0.5 rounded-full bg-cosmos-4" />}
              {item}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
