"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";

interface XPBarProps {
  current: number;
  max: number;
  label?: string;
  thick?: boolean;
  color?: "ignite" | "void" | "crown";
  className?: string;
}

const colorMap = {
  ignite: "bg-ignite",
  void:   "bg-void",
  crown:  "bg-crown",
};

export function XPBar({
  current,
  max,
  label,
  thick = false,
  color = "ignite",
  className,
}: XPBarProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-5% 0px" });
  const pct = Math.min((current / max) * 100, 100);

  return (
    <div ref={ref} className={cn("w-full", className)}>
      {label && (
        <p className="font-space-mono text-[10px] text-haze-3 mb-1 tracking-widest uppercase">
          {label}
        </p>
      )}
      <div
        className={cn(
          "w-full bg-cosmos-3 rounded-none overflow-hidden",
          thick ? "h-3" : "h-1.5"
        )}
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <motion.div
          className={cn("h-full", colorMap[color])}
          initial={{ width: 0 }}
          animate={inView ? { width: `${pct}%` } : { width: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}
