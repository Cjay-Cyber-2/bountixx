"use client";

/**
 * BountixxLogo — pixel-faithful SVG recreation of the logo mark.
 *
 * Structure (back to front):
 *  1. Dual ambient glow (warm left, purple right)
 *  2. Bold B letterform — deep indigo → violet → magenta gradient, two rounded lobes
 *  3. Three horizontal speed arrows — gold→orange→red, rounded-left cap + right chevron tip
 *  4. Three gold speed dots on the far left
 */

interface LogoProps {
  size?: number;
  showWordmark?: boolean;
  className?: string;
}

export function BountixxLogo({
  size = 56,
  showWordmark = false,
  className = "",
}: LogoProps) {
  /* The mark's natural proportions are 236 wide × 170 tall */
  const h = size;
  const w = size * (236 / 170);

  return (
    <div className={`flex items-center gap-3 ${className}`} style={{ lineHeight: 0 }}>
      <svg
        width={w}
        height={h}
        viewBox="0 0 236 170"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Bountixx logo mark"
        role="img"
      >
        <defs>
          {/* ── B gradient: deep indigo (bottom-left) → vivid violet → hot magenta (top-right) ── */}
          <linearGradient
            id="bxb"
            x1="88" y1="170"
            x2="210" y2="8"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%"   stopColor="#312E81" />
            <stop offset="22%"  stopColor="#4C1D95" />
            <stop offset="48%"  stopColor="#6D28D9" />
            <stop offset="72%"  stopColor="#9333EA" />
            <stop offset="88%"  stopColor="#C026D3" />
            <stop offset="100%" stopColor="#E879F9" />
          </linearGradient>

          {/* ── Speed-arrow gradient: bright gold → amber → orange → dark red (L→R) ── */}
          <linearGradient
            id="bxw"
            x1="18" y1="0"
            x2="196" y2="0"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%"   stopColor="#FCD34D" />
            <stop offset="20%"  stopColor="#FBBF24" />
            <stop offset="45%"  stopColor="#F97316" />
            <stop offset="70%"  stopColor="#EF4444" />
            <stop offset="100%" stopColor="#B91C1C" />
          </linearGradient>

          {/* ── Warm ambient glow (emanates from speed elements) ── */}
          <radialGradient id="bxa-w" cx="30%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#FBBF24" stopOpacity="0.55" />
            <stop offset="60%"  stopColor="#F97316" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#F97316" stopOpacity="0" />
          </radialGradient>

          {/* ── Purple ambient glow (emanates from B) ── */}
          <radialGradient id="bxa-p" cx="72%" cy="50%" r="45%">
            <stop offset="0%"   stopColor="#7C3AED" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
          </radialGradient>

          {/* ── Glow filter for B ── */}
          <filter id="bxfb" x="-18%" y="-18%" width="136%" height="136%">
            <feGaussianBlur stdDeviation="5" result="bl" />
            <feMerge>
              <feMergeNode in="bl" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* ── Glow filter for speed elements ── */}
          <filter id="bxfs" x="-35%" y="-55%" width="170%" height="210%">
            <feGaussianBlur stdDeviation="7" result="bl" />
            <feMerge>
              <feMergeNode in="bl" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* ── Tight glow filter for dots ── */}
          <filter id="bxfd" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="3.5" result="bl" />
            <feMerge>
              <feMergeNode in="bl" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── 1. Dual ambient glow backdrop ── */}
        <ellipse cx="68"  cy="85" rx="72" ry="70" fill="url(#bxa-w)" />
        <ellipse cx="158" cy="85" rx="80" ry="72" fill="url(#bxa-p)" />

        {/* ── 2. B letterform (evenodd punches lobe holes) ── */}
        {/*
          Outer B: left spine at x≈90, top at y=8, bottom at y=166.
          Two rounded lobes on the right.
          Inner holes are punched via fill-rule evenodd so the lobe
          interiors become transparent, revealing the arrows beneath.
        */}
        <path
          fillRule="evenodd"
          fill="url(#bxb)"
          filter="url(#bxfb)"
          d={[
            /* Outer B shape (clockwise) */
            "M 90,8",
            "L 152,8",
            "C 196,8 206,33 206,57",
            "C 206,76 196,88 173,92",
            "C 196,96 206,110 206,132",
            "C 206,156 196,168 152,168",
            "L 90,168 Z",
            /* Top lobe hole (clockwise — evenodd makes it transparent) */
            "M 108,28 L 150,28",
            "C 174,28 184,40 184,57",
            "C 184,74 174,80 150,80",
            "L 108,80 Z",
            /* Bottom lobe hole */
            "M 108,104 L 152,104",
            "C 178,104 188,116 188,132",
            "C 188,148 178,156 152,156",
            "L 108,156 Z",
          ].join(" ")}
        />

        {/* ── 3. Three speed arrows ── */}
        {/*
          Each arrow = a horizontal bar with a rounded left cap (semicircle)
          and a right chevron tip that reaches into the B's lobe interiors.

          The "A" arc: from bottom of cap to top of cap, CCW (sweep=0),
          radius = half bar-height → perfect semicircle going to the LEFT.

          Positions:
            Arrow 1 – through upper lobe, center y=57, h=23 → y=45.5..68.5
            Arrow 2 – middle divider,     center y=92, h=23 → y=80.5..103.5
            Arrow 3 – lower lobe,         center y=118, h=23 → y=106.5..129.5

          Left cap center-x = 40, so leftmost extent = 40-11.5 ≈ 28.
          Bar starts at x=40 (the right edge of the semicircle).
          Arrow tips reach to x≈190.
        */}

        {/* Arrow 1 */}
        <path
          fill="url(#bxw)"
          filter="url(#bxfs)"
          d="M 40,45 L 90,45 L 190,57 L 90,69 L 40,69 A 12,12 0 0 0 40,45 Z"
        />
        {/* Arrow 2 */}
        <path
          fill="url(#bxw)"
          filter="url(#bxfs)"
          d="M 40,80 L 90,80 L 194,92 L 90,104 L 40,104 A 12,12 0 0 0 40,80 Z"
        />
        {/* Arrow 3 */}
        <path
          fill="url(#bxw)"
          filter="url(#bxfs)"
          d="M 40,106 L 90,106 L 190,118 L 90,130 L 40,130 A 12,12 0 0 0 40,106 Z"
        />

        {/* ── 4. Three gold speed dots ── */}
        {/*
          Dots are at the leftmost positions, aligned with each arrow's vertical center.
          cx=18, radius=8. Right edge of dot (18+8=26) leaves a 2px gap to
          the bar's leftmost extent (28). Clean separation, matches the logo image.
        */}
        <circle cx="18" cy="57"  r="8.5" fill="#FBBF24" filter="url(#bxfd)" />
        <circle cx="18" cy="92"  r="8.5" fill="#FBBF24" filter="url(#bxfd)" />
        <circle cx="18" cy="118" r="8"   fill="#F59E0B" filter="url(#bxfd)" />
      </svg>

      {/* ── Wordmark (optional) ── */}
      {showWordmark && (
        <span
          className="font-orbitron font-bold tracking-widest select-none leading-none"
          style={{ fontSize: size * 0.36 }}
        >
          <span style={{ color: "var(--haze)" }}>BOUN</span>
          <span style={{ color: "var(--ignite)" }}>TI</span>
          <span style={{ color: "var(--crown)" }}>XX</span>
        </span>
      )}
    </div>
  );
}

/** Compact text-only wordmark for tight spaces */
export function BountixxWordmark({ size = 20 }: { size?: number }) {
  return (
    <span
      className="font-orbitron font-bold tracking-widest select-none leading-none"
      style={{ fontSize: size }}
    >
      <span style={{ color: "var(--haze)" }}>BOUN</span>
      <span style={{ color: "var(--ignite)" }}>TI</span>
      <span style={{ color: "var(--crown)" }}>XX</span>
    </span>
  );
}
