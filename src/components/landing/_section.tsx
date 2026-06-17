"use client";

/**
 * Shared landing-section layout + typography.
 * One full-width container with symmetric padding — no nested narrow columns.
 */

import type { ReactNode, CSSProperties } from "react";

/** Full-width page shell with equal side padding (no max-width cap). */
export const LANDING_GUTTERS =
  "w-full mx-auto px-5 sm:px-8 md:px-10 lg:px-12 xl:px-16";

export const APP_GUTTERS = LANDING_GUTTERS;

/** @deprecated Use LANDING_GUTTERS only — kept so imports don't break. */
export const LANDING_CONTENT = "w-full";

/** @deprecated Use APP_GUTTERS only — kept so imports don't break. */
export const APP_CONTENT = "w-full";

type LandingSectionProps = {
  id?: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  variant?: "default" | "raised";
};

export function LandingSection({
  id,
  children,
  className = "",
  style,
  variant = "default",
}: LandingSectionProps) {
  return (
    <section
      id={id}
      className={`cyber-grid relative py-24 md:py-32 lg:py-36 overflow-hidden ${className}`}
      style={{
        background: variant === "raised" ? "var(--cosmos-2)" : "var(--cosmos)",
        borderTop: variant === "raised" ? "1px solid var(--border-1)" : undefined,
        borderBottom: variant === "raised" ? "1px solid var(--border-1)" : undefined,
        ...style,
      }}
    >
      <div className={LANDING_GUTTERS}>{children}</div>
    </section>
  );
}

export function SpecLine({
  index,
  children,
  className = "",
  centered = true,
}: {
  index?: string;
  children: ReactNode;
  className?: string;
  centered?: boolean;
}) {
  return (
    <p
      className={`font-space-mono text-[11px] tracking-[5px] uppercase flex items-center gap-3 text-void ${
        centered ? "justify-center" : ""
      } ${className}`}
    >
      {!centered && <span className="h-px w-8 bg-void/60 shrink-0" aria-hidden />}
      {index && <span className="tabular-nums text-void-light">{index}</span>}
      <span className="text-haze-3">{children}</span>
      {centered && <span className="h-px w-8 bg-void/60 shrink-0" aria-hidden />}
    </p>
  );
}

export function SectionHeading({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={`font-zen-dots text-[clamp(1.75rem,4vw,3.25rem)] text-haze leading-[1.12] tracking-tight text-balance ${className}`}
    >
      {children}
    </h2>
  );
}

/** Purple brand accent inside headings — use at most once per heading. */
export function Accent({ children }: { children: ReactNode }) {
  return <span className="text-void">{children}</span>;
}

export function SectionIntro({
  eyebrow,
  title,
  description,
  extra,
  className = "",
  align = "center",
}: {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  extra?: string;
  className?: string;
  align?: "left" | "center";
}) {
  const centered = align === "center";

  return (
    <div
      className={`mb-16 md:mb-20 lg:mb-24 w-full ${centered ? "mx-auto text-center" : ""} ${className}`}
    >
      <SpecLine className={centered ? "justify-center" : ""} centered={centered}>
        {eyebrow}
      </SpecLine>
      <SectionHeading className="mt-5 md:mt-6">{title}</SectionHeading>
      {description && (
        <p
          className={`font-rajdhani text-lg md:text-xl text-haze-2 mt-6 md:mt-8 leading-relaxed max-w-[62ch] ${centered ? "mx-auto" : ""}`}
        >
          {description}
        </p>
      )}
      {extra && (
        <p
          className={`font-rajdhani text-base text-haze-3 mt-4 leading-relaxed max-w-[62ch] ${centered ? "mx-auto" : ""}`}
        >
          {extra}
        </p>
      )}
    </div>
  );
}

/** Shared app-page frame — full width of the viewport padding band. */
export function PageShell({
  children,
  className = "",
  width = "full",
  align = "center",
}: {
  children: ReactNode;
  className?: string;
  width?: "3xl" | "4xl" | "5xl" | "full";
  align?: "left" | "center";
}) {
  const widthClass =
    width === "full"
      ? "w-full"
      : width === "5xl"
        ? "w-full max-w-5xl mx-auto"
        : width === "3xl"
          ? "w-full max-w-3xl mx-auto"
          : "w-full max-w-4xl mx-auto";

  const alignClass = align === "center" ? "text-center" : "";

  return (
    <div className={`${APP_GUTTERS} py-8 md:py-12 lg:py-16`}>
      <div
        className={`${widthClass} border border-cosmos-4/80 px-5 py-8 sm:px-8 sm:py-10 md:px-10 md:py-12 lg:px-12 lg:py-14 ${alignClass} ${className}`}
        style={{
          background:
            "linear-gradient(180deg, rgba(19,12,36,0.72) 0%, rgba(14,8,24,0.96) 100%)",
          boxShadow:
            "0 0 0 1px rgba(168,85,247,0.06), 0 28px 90px rgba(0,0,0,0.38)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
