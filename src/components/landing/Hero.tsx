"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { Zap, ChevronRight } from "lucide-react";
import { ParticleArena } from "./ParticleArena";
import { BountixxLogo } from "@/components/BountixxLogo";
import { Button } from "@/components/ui/Button";
import { fadeIn, wordContainer, wordChild } from "@/lib/animations";

const HEADLINE_WORDS = [
  { text: "COMPETE.",  color: "var(--haze)"   },
  { text: "CONQUER.", color: "var(--void)"  },
  { text: "COLLECT.", color: "var(--crown)"   },
];

const LIVE_STATS = [
  { n: "2,341",  label: "Online Now"    },
  { n: "14.8k",  label: "Arenas Played" },
  { n: "2.1M",   label: "Coins Awarded" },
  { n: "41",     label: "Countries"     },
];

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const parallaxY = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const parallaxO = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex flex-col overflow-hidden bg-cosmos"
      aria-label="Bountixx hero — Compete, Conquer, Collect"
    >
      {/* ── Canvas particles ── */}
      <ParticleArena />

      {/* ── Atmospheric gradients ── */}
      <motion.div
        style={{ y: parallaxY }}
        className="absolute inset-0 pointer-events-none"
        aria-hidden
      >
        {/* Deep purple top-right blob */}
        <div
          className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full opacity-50"
          style={{ background: "radial-gradient(circle, rgba(168,85,247,0.18) 0%, transparent 65%)" }}
        />
        {/* Warm ignite bottom-left blob */}
        <div
          className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full opacity-40"
          style={{ background: "radial-gradient(circle, rgba(255,107,26,0.12) 0%, transparent 65%)" }}
        />
        {/* Radial vignette at edges */}
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 90% 80% at 50% 50%, transparent 45%, #0E0818 100%)",
          }}
        />
      </motion.div>

      {/* ── Scanline texture ── */}
      <div className="absolute inset-0 pointer-events-none scanline-fx opacity-30" aria-hidden />

      {/* ── Main grid ── */}
      <motion.div
        style={{ opacity: parallaxO }}
        className="relative z-10 flex-1 flex items-center"
      >
        <div className="w-full max-w-[1400px] mx-auto px-6 lg:px-14 pt-28 pb-20 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-12 xl:gap-20 items-center">

          {/* ══ LEFT: copy ══ */}
          <div className="flex flex-col">

            {/* Live pulse badge */}
            <motion.div
              variants={fadeIn}
              initial="hidden"
              animate="show"
              transition={{ delay: 0.15 }}
              className="flex items-center gap-2.5 mb-10"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inset-0 rounded-full bg-success animate-[livepulse_1.5s_ease-in-out_infinite]" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
              </span>
              <span className="font-space-mono text-xs text-success tracking-[3px] uppercase">
                2,341 Competitors Online
              </span>
            </motion.div>

            {/* Pre-heading */}
            <motion.p
              variants={fadeIn}
              initial="hidden"
              animate="show"
              transition={{ delay: 0.3 }}
              className="font-space-mono text-[11px] text-haze-3 tracking-[8px] uppercase mb-6"
            >
              The AI-Powered Challenge Arena
            </motion.p>

            {/* ── Hero headline — word stagger ── */}
            <motion.div
              variants={wordContainer}
              initial="hidden"
              animate="show"
              className="mb-10"
              aria-label="Compete. Conquer. Collect."
            >
              {HEADLINE_WORDS.map(({ text, color }) => (
                <motion.h1
                  key={text}
                  variants={wordChild}
                  className="font-zen-dots leading-[0.95] tracking-tight block"
                  style={{
                    color,
                    fontSize: "clamp(2.5rem, 6vw, 5rem)",
                  }}
                >
                  {text}
                </motion.h1>
              ))}
            </motion.div>

            {/* Value prop */}
            <motion.p
              variants={fadeIn}
              initial="hidden"
              animate="show"
              transition={{ delay: 1.1 }}
              className="font-rajdhani text-xl md:text-2xl text-haze-2 max-w-[540px] leading-relaxed mb-12"
            >
              Drop any challenge — code, trivia, logic, math. Lock the room.
              AI referees the battle. One winner claims the bounty.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              variants={fadeIn}
              initial="hidden"
              animate="show"
              transition={{ delay: 1.4 }}
              className="flex flex-wrap items-center gap-5 mb-14"
            >
              <Link href="/signup">
                <Button variant="primary" size="lg" magnetic className="text-base px-10 h-14">
                  <Zap size={18} className="mr-2" aria-hidden />
                  START FOR FREE
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="ghost" size="lg" magnetic className="text-base text-haze-2 gap-2">
                  Watch a Live Room
                  <ChevronRight size={16} aria-hidden />
                </Button>
              </Link>
            </motion.div>

            {/* Live stats strip */}
            <motion.div
              variants={fadeIn}
              initial="hidden"
              animate="show"
              transition={{ delay: 1.7 }}
              className="flex flex-wrap gap-x-8 gap-y-3"
            >
              {LIVE_STATS.map(({ n, label }) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span className="font-orbitron font-bold text-lg text-haze leading-none">
                    {n}
                  </span>
                  <span className="font-space-mono text-[10px] text-haze-3 tracking-widest uppercase">
                    {label}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* ══ RIGHT: rotating logo + UI preview cards ══ */}
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.7 }}
            className="hidden lg:flex flex-col items-center justify-center relative gap-8"
          >
            {/* Rotating logo with pulse rings */}
            <div className="relative flex items-center justify-center">
              {/* Outer ring pulse */}
              <span
                className="absolute rounded-full border border-void/15 animate-[pulsering_3s_ease-out_infinite]"
                style={{ width: 360, height: 360 }}
                aria-hidden
              />
              <span
                className="absolute rounded-full border border-void-deep/10 animate-[pulsering_3s_ease-out_infinite_1s]"
                style={{ width: 360, height: 360 }}
                aria-hidden
              />
              {/* Inner glow circle */}
              <div
                className="absolute w-48 h-48 rounded-full pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)",
                }}
                aria-hidden
              />
              {/* Slow-spinning logo */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 80, ease: "linear", repeat: Infinity }}
              >
                <BountixxLogo size={200} />
              </motion.div>
            </div>

            {/* Mini "live room" preview card */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 1.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-[340px] bg-cosmos-2 border border-cosmos-4 p-5"
              style={{ background: "rgba(19,12,36,0.9)" }}
            >
              {/* Card header */}
              <div className="flex items-center justify-between mb-4">
                <span className="font-space-mono text-[10px] text-haze-3 tracking-widest uppercase">
                  Live Arena
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-ignite animate-[livepulse_1.5s_ease-in-out_infinite]" aria-hidden />
                  <span className="font-space-mono text-[10px] text-ignite">LIVE</span>
                </span>
              </div>
              <p className="font-orbitron font-bold text-sm text-haze mb-4 leading-snug">
                String Reversal Clash
              </p>
              {/* Player bars */}
              <div className="space-y-2.5 mb-4">
                {[
                  { name: "zainab_codes", pct: 78, color: "#FF6B1A", delay: 1.4 },
                  { name: "dev_tolu",     pct: 52, color: "#a855f7", delay: 1.6 },
                  { name: "chisom_x",     pct: 91, color: "#F0A500", delay: 1.8 },
                ].map((p) => (
                  <div key={p.name} className="flex items-center gap-3">
                    <span className="font-rajdhani text-xs text-haze-2 w-24 shrink-0 truncate">
                      @{p.name}
                    </span>
                    <div className="flex-1 h-1.5 bg-cosmos-3 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${p.pct}%` }}
                        transition={{ delay: p.delay, duration: 0.9, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ background: p.color }}
                      />
                    </div>
                    <span className="font-space-mono text-[9px] text-haze-3 w-8 text-right">
                      {p.pct}%
                    </span>
                  </div>
                ))}
              </div>
              {/* Timer */}
              <div className="flex items-center justify-between pt-3 border-t border-cosmos-4">
                <span className="font-space-mono text-[10px] text-haze-3">TIME LEFT</span>
                <span className="font-orbitron font-bold text-sm text-danger">00:42</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* ── Scroll indicator ── */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden
      >
        <div className="w-px h-10 bg-gradient-to-b from-transparent to-void/60" />
        <span className="font-space-mono text-[9px] text-haze-3 tracking-[4px] uppercase">
          Explore
        </span>
      </motion.div>
    </section>
  );
}
