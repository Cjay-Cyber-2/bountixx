"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { LANDING_GUTTERS } from "@/components/landing/_section";

type StatItem = {
  value: number | null;
  label: string;
  special: string | null;
};

const BASE_STATS: StatItem[] = [
  { value: null, label: "Entry fee", special: "100" },
  { value: null, label: "Players online", special: null },
  { value: null, label: "Challenge types", special: "7+" },
  { value: null, label: "To compete", special: "FREE" },
];

export function Stats() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    fetch("/api/presence/count", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { count?: number }) => {
        if (typeof d.count === "number") setOnlineCount(d.count);
      })
      .catch(() => {});
    const id = window.setInterval(() => {
      fetch("/api/presence/count", { cache: "no-store" })
        .then((r) => r.json())
        .then((d: { count?: number }) => {
          if (typeof d.count === "number") setOnlineCount(d.count);
        })
        .catch(() => {});
    }, 30_000);
    return () => window.clearInterval(id);
  }, []);

  const stats = BASE_STATS.map((stat) =>
    stat.label === "Players online"
      ? { ...stat, value: onlineCount, special: null as string | null }
      : stat,
  );

  return (
    <section
      ref={ref}
      className="relative py-28 md:py-36 overflow-hidden bg-cosmos-2 border-y border-cosmos-4"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(155,107,255,0.06) 0%, transparent 70%)",
        }}
        aria-hidden
      />

      <div className={`${LANDING_GUTTERS} relative`}>
        <div className="mb-16 md:mb-20 flex flex-col sm:flex-row items-center justify-center gap-4 border-b border-cosmos-4 pb-8 text-center">
          <p className="font-space-mono text-[10px] tracking-[5px] uppercase text-haze-3">
            Live · Right now on Bountixx
          </p>
          <span className="flex items-center gap-2 font-space-mono text-[9px] text-success tracking-[3px] uppercase">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success" />
            </span>
            Live
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-l border-cosmos-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative p-8 md:p-12 border-b border-r border-cosmos-4 text-center"
            >
              <div className="mb-3 h-[3.2rem] flex items-end justify-center">
                {stat.special ? (
                  <span className="font-zen-dots text-4xl md:text-5xl leading-none text-haze">
                    {stat.special}
                  </span>
                ) : (
                  <AnimatedNumber
                    value={stat.value ?? 0}
                    className="font-zen-dots text-4xl md:text-5xl leading-none text-haze"
                  />
                )}
              </div>
              <p className="font-space-mono text-[10px] text-haze-3 tracking-[3px] uppercase">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
