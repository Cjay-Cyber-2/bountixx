"use client";

/**
 * Hero — the brand animation fills the whole stage (cover), centered and
 * responsive. Soft scrims keep the HUD text legible over it. No grid patterns.
 */

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { Zap, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Lottie from "lottie-react";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
});

const fadeIn = (delay: number) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { delay, duration: 0.8 },
});

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const [animationData, setAnimationData] = useState<unknown>(null);

  useEffect(() => {
    fetch("/bountixx.json")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load bountixx.json");
        return res.json();
      })
      .then(setAnimationData)
      .catch((err) => console.error("Lottie load error:", err));
  }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const fadeOut = useTransform(scrollYProgress, [0, 0.55], [1, 0]);
  const animScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);

  return (
    <section
      ref={sectionRef}
      className="relative h-[100vw] min-h-[600px] max-h-[1280px] flex flex-col overflow-hidden bg-cosmos"
      aria-label="Bountixx — Drop a challenge, claim the bounty"
    >
      {/* ── Full-bleed Lottie Centerpiece ── */}
      <motion.div
        className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
        style={{ scale: reduceMotion ? 1 : animScale }}
      >
        {animationData ? (
          <Lottie
            animationData={animationData}
            loop
            autoplay
            style={{ width: "100%", height: "100%" }}
            rendererSettings={{ preserveAspectRatio: "xMidYMid slice" }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-void/40 border-t-void animate-spin" />
              <span className="font-space-mono text-[10px] text-haze-3 tracking-[4px] uppercase">
                Loading Arena
              </span>
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Legibility scrims (no grid) ── */}
      <div className="absolute inset-0 z-[1] pointer-events-none" aria-hidden>
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(14,8,24,0.82) 0%, rgba(14,8,24,0.28) 26%, rgba(14,8,24,0.18) 50%, rgba(14,8,24,0.55) 78%, rgba(14,8,24,0.92) 100%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 90% 75% at 50% 50%, transparent 45%, rgba(14,8,24,0.55) 100%)",
          }}
        />
      </div>

      {/* ── HUD overlay ── */}
      <motion.div
        className="relative z-10 flex-1 flex flex-col justify-between pointer-events-none"
        style={{ opacity: fadeOut }}
      >
        {/* Top */}
        <div className="flex flex-col items-center text-center pt-24 md:pt-32 lg:pt-36 px-6 pointer-events-auto">
          <motion.h1
            {...fadeUp(0.3)}
            className="font-zen-dots text-balance"
            style={{
              fontSize: "clamp(1.75rem, 5vw, 4.2rem)",
              letterSpacing: "0.04em",
              lineHeight: "1.25",
            }}
          >
            <span className="text-haze">DROP A CHALLENGE.</span>
            <br />
            <span
              style={{
                background: "linear-gradient(110deg, #FF6B1A 0%, #FF7A5C 50%, #F0A500 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0 0 26px rgba(255,107,26,0.25))",
              }}
            >
              CLAIM THE BOUNTY.
            </span>
          </motion.h1>


          <motion.p
            {...fadeUp(0.5)}
            className="font-rajdhani text-base md:text-lg text-haze-2 max-w-md mt-5 leading-relaxed"
          >
            Any challenge. The AI referees. The winner takes all.
          </motion.p>
        </div>

        {/* Bottom */}
        <div className="flex flex-col items-center gap-6 pb-10 md:pb-14 px-6 pointer-events-auto">
          <motion.div {...fadeUp(0.7)} className="flex flex-col sm:flex-row items-center gap-4">
            <Link href="/signup">
              <Button
                variant="primary"
                size="lg"
                magnetic
                className="text-base px-10 h-14 group relative overflow-hidden"
                style={
                  {
                    background: "#FF6B1A",
                    borderColor: "#FF6B1A",
                    boxShadow:
                      "0 0 40px rgba(255,107,26,0.45), 0 0 80px rgba(255,107,26,0.16), inset 0 1px 0 rgba(255,255,255,0.15)",
                  } as React.CSSProperties
                }
              >
                <Zap size={16} className="mr-2 transition-transform group-hover:rotate-12 group-hover:scale-110" aria-hidden />
                ENTER THE ARENA
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button
                variant="ghost"
                size="lg"
                magnetic
                className="text-base text-haze-2 gap-2 hover:text-haze"
                style={{
                  backdropFilter: "blur(8px)",
                  background: "rgba(14,8,24,0.4)",
                  border: "1px solid rgba(45,27,105,0.6)",
                }}
              >
                Watch a Live Room
                <ChevronRight size={14} aria-hidden />
              </Button>
            </Link>
          </motion.div>

          <motion.p
            {...fadeIn(0.85)}
            className="font-space-mono text-[10px] md:text-[11px] tracking-[6px] uppercase text-haze-3"
          >
            Compete · Conquer · Collect
          </motion.p>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 flex-col items-center gap-1.5 z-20 hidden md:flex"
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden
      >
        <span className="font-space-mono text-[8px] text-haze-3/50 tracking-[4px] uppercase">Scroll</span>
        <span
          className="w-px h-6"
          style={{ background: "linear-gradient(to bottom, transparent, rgba(255,107,26,0.4))" }}
        />
      </motion.div>
    </section>
  );
}
