"use client";

/**
 * Shared landing-section primitives — one consistent cyberpunk language
 * so each section reads as deliberate, not reflexively templated.
 */

import type { ReactNode } from "react";

/** A spec-line label that carries real information (index + meta), not a bare category name. */
export function SpecLine({
  index,
  children,
  color = "#9B6BFF",
}: {
  index?: string;
  children: ReactNode;
  color?: string;
}) {
  return (
    <p className="font-space-mono text-[11px] tracking-[5px] uppercase flex items-center gap-3 mb-4">
      <span className="h-px w-7" style={{ background: color, opacity: 0.7 }} aria-hidden />
      {index && (
        <span style={{ color }} className="tabular-nums">
          {index}
        </span>
      )}
      <span className="text-haze-3">{children}</span>
    </p>
  );
}

/** Section heading — the star. Display weight, balanced wrap, with one optional accent word. */
export function SectionHeading({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={`font-zen-dots text-[clamp(1.65rem,4.2vw,3.25rem)] text-haze leading-[1.06] tracking-tight text-balance ${className}`}
    >
      {children}
    </h2>
  );
}

/** A single accented word inside a heading (used sparingly, deliberately). */
export function Accent({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        background: "linear-gradient(110deg, #FF6B1A 0%, #FF7A5C 55%, #F0A500 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }}
    >
      {children}
    </span>
  );
}
