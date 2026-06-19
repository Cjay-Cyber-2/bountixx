"use client";

/**
 * Left-side brand panel shared by /login and /signup.
 *
 * Renders the official animated brand mark (bountixx.svg) full-bleed inside
 * the left column — no aspect-square boxing, just edge-to-edge SVG.
 *
 * The panel is hidden below lg — mobile shows the form full-width.
 */

import { useState } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";

export function AuthBrandPanel() {
  const [svgFailed, setSvgFailed] = useState(false);
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <div className="hidden lg:flex bg-[var(--cosmos-2)] border-r border-[var(--border-2)] relative overflow-hidden transition-colors duration-350">
      {/* Ambient glow layers */}
      <div
        className="absolute inset-0 pointer-events-none z-[2]"
        style={{
          background: isLight
            ? "radial-gradient(ellipse 70% 55% at 50% 40%, rgba(249,35,19,0.05) 0%, transparent 70%)"
            : "radial-gradient(ellipse 70% 55% at 50% 40%, rgba(155,107,255,0.10) 0%, transparent 70%)," +
              "radial-gradient(ellipse 55% 45% at 50% 85%, rgba(255,107,26,0.06) 0%, transparent 72%)",
        }}
        aria-hidden
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
          style={{ borderColor: isLight ? "var(--border-2)" : "rgba(155,107,255,0.30)" }}
          aria-hidden
        />
      ))}

      {/* SVG animation — full bleed, no boxing */}
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
                ? "drop-shadow(0 4px 24px rgba(78,39,37,0.10))"
                : "drop-shadow(0 0 40px rgba(155,107,255,0.20))",
            }}
            aria-label="Bountixx arena animation"
          />
        )}
      </div>
    </div>
  );
}
