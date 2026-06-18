"use client";

/**
 * Shared landing-section layout + typography.
 */

import type { ReactNode, CSSProperties } from "react";

export const LANDING_GUTTERS =
  "w-full mx-auto px-5 sm:px-8 md:px-10 lg:px-12 xl:px-16 2xl:px-20";

export const APP_GUTTERS = LANDING_GUTTERS;

/** @deprecated Use LANDING_GUTTERS only */
export const LANDING_CONTENT = "w-full";
/** @deprecated Use APP_GUTTERS only */
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
      className={`relative py-20 md:py-28 lg:py-32 overflow-hidden ${className}`}
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
      className={`font-mono text-xs tracking-wide flex items-center gap-3 text-plum ${
        centered ? "justify-center" : ""
      } ${className}`}
    >
      {!centered && <span className="h-px w-8 bg-plum/40 shrink-0" aria-hidden />}
      {index && <span className="tabular-nums text-plum-light">{index}</span>}
      <span className="text-haze-3 font-medium">{children}</span>
      {centered && <span className="h-px w-8 bg-plum/40 shrink-0" aria-hidden />}
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
      className={`font-display text-[clamp(2rem,4.5vw,3.5rem)] text-haze leading-[1.1] tracking-tight text-balance ${className}`}
    >
      {children}
    </h2>
  );
}

export function Accent({ children }: { children: ReactNode }) {
  return <span className="text-plum italic">{children}</span>;
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
      className={`mb-14 md:mb-18 lg:mb-20 w-full max-w-3xl ${centered ? "mx-auto text-center" : ""} ${className}`}
    >
      <SpecLine className={centered ? "justify-center" : ""} centered={centered}>
        {eyebrow}
      </SpecLine>
      <SectionHeading className="mt-4 md:mt-5">{title}</SectionHeading>
      {description && (
        <p
          className={`font-body text-lg md:text-xl text-haze-2 mt-5 md:mt-6 leading-relaxed max-w-[62ch] ${centered ? "mx-auto" : ""}`}
        >
          {description}
        </p>
      )}
      {extra && (
        <p
          className={`font-body text-base text-haze-3 mt-3 leading-relaxed max-w-[62ch] ${centered ? "mx-auto" : ""}`}
        >
          {extra}
        </p>
      )}
    </div>
  );
}

/** App page frame — comfortable width, clean card surface */
export function PageShell({
  children,
  className = "",
  width = "4xl",
  align = "left",
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
        ? "w-full max-w-5xl"
        : width === "3xl"
          ? "w-full max-w-3xl"
          : "w-full max-w-4xl";

  const alignClass = align === "center" ? "text-center" : "";

  return (
    <div className={`${APP_GUTTERS} py-8 md:py-12 lg:py-14`}>
      <div
        className={`${widthClass} mx-auto rounded-2xl border border-[var(--border-1)] px-6 py-8 sm:px-10 sm:py-10 md:px-12 md:py-12 ${alignClass} ${className}`}
        style={{
          background: "var(--surface-card)",
          boxShadow: "0 1px 3px rgba(78, 39, 37, 0.06), 0 8px 32px rgba(78, 39, 37, 0.08)",
          transition: "var(--theme-transition)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
