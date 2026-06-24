"use client";

/**
 * Left-side brand panel shared by /login and /signup.
 *
 * Both panels (this one + the form on the right) share the SAME theme canvas
 * so dark mode is dark on both sides and light mode is light on both sides.
 *
 * The animated SVG / video fills the entire panel and tints with the
 * active brand primary via CSS color-mix so it never clashes with the theme.
 */

import { useState } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";

export function AuthBrandPanel() {
  const [svgFailed, setSvgFailed] = useState(false);
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <div
      className="auth-brand-panel hidden lg:flex relative min-h-screen overflow-hidden"
      aria-hidden={false}
    >
      {/* Ambient brand glow */}
      <div
        className="absolute inset-0 pointer-events-none z-[2]"
        style={{
          background: isLight
            ? "radial-gradient(ellipse 70% 55% at 50% 40%, rgba(124,92,255,0.10) 0%, transparent 70%)"
            : "radial-gradient(ellipse 70% 55% at 50% 40%, rgba(124,92,255,0.16) 0%, transparent 70%)," +
              "radial-gradient(ellipse 55% 45% at 50% 85%, rgba(255,107,26,0.05) 0%, transparent 72%)",
        }}
      />

      {/* Corner brackets — minimal HUD frame */}
      {[
        { c: "top-7 left-7", b: "border-t border-l" },
        { c: "top-7 right-7", b: "border-t border-r" },
        { c: "bottom-7 left-7", b: "border-b border-l" },
        { c: "bottom-7 right-7", b: "border-b border-r" },
      ].map(({ c, b }) => (
        <div
          key={c}
          className={`absolute ${c} w-8 h-8 ${b} z-10`}
          style={{ borderColor: "var(--border-accent)" }}
          aria-hidden
        />
      ))}

      {/* Brand visual — full bleed */}
      <div className="absolute inset-0 z-[1]">
        {svgFailed ? (
          <video
            src="/bountixx-hero.mp4"
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <object
            type="image/svg+xml"
            data="/bountixx.svg"
            onError={() => setSvgFailed(true)}
            className="w-full h-full pointer-events-none"
            style={{
              display: "block",
              filter: isLight
                ? "drop-shadow(0 4px 24px rgba(31,27,54,0.08))"
                : "drop-shadow(0 0 40px rgba(124,92,255,0.22))",
            }}
            aria-label="Bountixx arena animation"
          />
        )}
      </div>
    </div>
  );
}
