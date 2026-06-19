"use client";

/**
 * Shared landing-section layout + typography.
 */

import type { ReactNode, CSSProperties } from "react";

/** Horizontal gutters — defined in globals.css (.page-gutters) with safe-area insets. */
export const LANDING_GUTTERS = "page-gutters";

export const APP_GUTTERS = LANDING_GUTTERS;

/** Vertical rhythm between major landing blocks (intro → cards → subsections). */
export const LANDING_STACK = "landing-block-stack";

/** Vertical rhythm inside a subsection (heading → grid). */
export const LANDING_SUBSTACK = "landing-subsection-stack";

/** Bordered card padding — matches create arena question cards. */
export const LANDING_SURFACE = "landing-surface";
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
      className={`relative py-40 md:py-56 lg:py-72 xl:py-80 overflow-hidden ${className}`}
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
  if (centered) {
    return (
      <p className={`font-mono text-xs tracking-wide text-center text-plum w-full ${className}`}>
        <span className="inline-flex items-center justify-center gap-3">
          {index && <span className="tabular-nums text-plum-light">{index}</span>}
          <span className="text-haze-3 font-medium">{children}</span>
        </span>
      </p>
    );
  }

  return (
    <p
      className={`font-mono text-xs tracking-wide flex items-center gap-3 text-plum ${className}`}
    >
      <span className="h-px w-8 bg-plum/40 shrink-0" aria-hidden />
      {index && <span className="tabular-nums text-plum-light">{index}</span>}
      <span className="text-haze-3 font-medium">{children}</span>
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

/** Centered section header block — use at the top of landing sections */
export function CenteredSectionIntro({
  eyebrow,
  title,
  description,
  extra,
  className = "",
}: {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  extra?: string;
  className?: string;
}) {
  return (
    <div className={`mb-28 md:mb-36 lg:mb-44 flex w-full justify-center ${className}`}>
      <SectionIntro
        eyebrow={eyebrow}
        title={title}
        description={description}
        extra={extra}
        align="center"
        className="mb-0"
      />
    </div>
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
      className={`mb-28 md:mb-36 lg:mb-44 w-full max-w-3xl ${
        centered ? "mx-auto flex flex-col items-center text-center" : ""
      } ${className}`}
    >
      <SpecLine className={`w-full ${centered ? "justify-center" : ""}`} centered={centered}>
        {eyebrow}
      </SpecLine>
      <SectionHeading className={`mt-8 md:mt-10 ${centered ? "w-full text-center" : ""}`}>{title}</SectionHeading>
      {description && (
        <p
          className={`font-body text-lg md:text-xl text-haze-2 mt-10 md:mt-12 leading-[1.85] max-w-[54ch] ${centered ? "mx-auto text-center" : ""}`}
        >
          {description}
        </p>
      )}
      {extra && (
        <p
          className={`font-body text-base md:text-lg text-haze-3 mt-6 md:mt-8 leading-[1.85] max-w-[54ch] ${centered ? "mx-auto text-center" : ""}`}
        >
          {extra}
        </p>
      )}
    </div>
  );
}

/** App page frame — full-width, fills viewport below nav */
export function AppPage({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex-1 w-full min-h-0 ${APP_GUTTERS} py-10 md:py-14 lg:py-16 pb-[max(2.5rem,calc(5rem+env(safe-area-inset-bottom,0px)))] md:pb-14 lg:pb-16`}
    >
      <div className={`w-full flex flex-col min-w-0 ${className}`}>{children}</div>
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
    <div className={`${APP_GUTTERS} py-10 md:py-14 lg:py-16`}>
      <div
        className={`${widthClass} mx-auto rounded-2xl border border-[var(--border-1)] px-7 py-9 sm:px-10 sm:py-11 md:px-12 md:py-14 ${alignClass} ${className}`}
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
