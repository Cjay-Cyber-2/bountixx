"use client";

/**
 * Shared landing-section layout + typography.
 * One container width, one accent system (void purple), generous gutters.
 */

import type { ReactNode, CSSProperties } from "react";

/** Matches LandingNav / hero alignment — content never hugs the viewport edge. */
export const LANDING_GUTTERS =
  "w-full max-w-[1280px] mx-auto px-6 sm:px-8 md:px-12 lg:px-14 xl:px-16 2xl:px-20";

export const APP_GUTTERS =
  "w-full max-w-[1280px] mx-auto px-6 sm:px-8 md:px-12 lg:px-14 xl:px-16";

/** Centered reading column inside landing sections — stops copy hugging the left rail. */
export const LANDING_CONTENT = "mx-auto w-full max-w-[1120px]";

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
      <div className={`${LANDING_GUTTERS} relative`}>
        <div className={LANDING_CONTENT}>{children}</div>
      </div>
    </section>
  );
}

export function SpecLine({
  index,
  children,
  className = "",
}: {
  index?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={`font-space-mono text-[11px] tracking-[5px] uppercase flex items-center gap-3 text-void ${className}`}>
      <span className="h-px w-8 bg-void/60 shrink-0" aria-hidden />
      {index && <span className="tabular-nums text-void-light">{index}</span>}
      <span className="text-haze-3">{children}</span>
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
      className={`mb-16 md:mb-20 lg:mb-24 max-w-3xl ${centered ? "mx-auto text-center" : ""} ${className}`}
    >
      <SpecLine className={centered ? "justify-center" : ""}>{eyebrow}</SpecLine>
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

/** Shared app-page frame — visible panel, aligned with TopNav gutters. */
export function PageShell({
  children,
  className = "",
  width = "4xl",
}: {
  children: ReactNode;
  className?: string;
  width?: "3xl" | "4xl" | "5xl" | "full";
}) {
  const widthClass =
    width === "full"
      ? "max-w-none"
      : width === "5xl"
        ? "max-w-5xl"
        : width === "3xl"
          ? "max-w-3xl"
          : "max-w-4xl";

  return (
    <div className={`${APP_GUTTERS} py-8 md:py-12 lg:py-16`}>
      <div
        className={`mx-auto w-full ${widthClass} border border-cosmos-4/80 px-6 py-8 sm:px-10 sm:py-10 md:px-12 md:py-12 lg:px-14 lg:py-14 ${className}`}
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
