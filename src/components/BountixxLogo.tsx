"use client";

import Image from "next/image";

type CoinTier = "bronze" | "silver" | "gold" | "diamond";

interface LogoProps {
  size?: number;
  showWordmark?: boolean;
  className?: string;
  variant?: "default" | "light" | "coral";
}

interface CoinProps {
  tier: CoinTier;
  size?: number;
  amount?: number;
  className?: string;
}

const TIER_COLORS: Record<CoinTier, { crown: string; crownLight: string; dot: string; glow: string; label: string }> = {
  bronze:  { crown: "#CD7F32", crownLight: "#E8A456", dot: "#3D1A00", glow: "rgba(205,127,50,0.4)",  label: "Bronze"  },
  silver:  { crown: "#A8A8A8", crownLight: "#D0D0D0", dot: "#2A2A2A", glow: "rgba(168,168,168,0.4)", label: "Silver"  },
  gold:    { crown: "#FF5533", crownLight: "#FF7A5C", dot: "#111B56", glow: "rgba(255,85,51,0.45)",   label: "Gold"    },
  diamond: { crown: "#7DD3FC", crownLight: "#BAE6FD", dot: "#0C1340", glow: "rgba(125,211,252,0.5)",  label: "Diamond" },
};

/** The core crown mark — inline SVG matching the official brand guide */
export function CrownMark({
  size = 56,
  crownColor = "#FF5533",
  crownLight = "#FF7A5C",
  dotColor = "#111B56",
  id = "default",
}: {
  size?: number;
  crownColor?: string;
  crownLight?: string;
  dotColor?: string;
  id?: string;
}) {
  const gradId = `cg-${id}`;
  const h = size;
  const w = size * 1.22; // crown is slightly wider than tall

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 122 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="61" y1="5" x2="61" y2="78" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor={crownLight} />
          <stop offset="55%"  stopColor={crownColor} />
          <stop offset="100%" stopColor={crownColor} stopOpacity="0.92" />
        </linearGradient>
        {/* Subtle highlight on spike tips */}
        <radialGradient id={`hl-${id}`} cx="40%" cy="20%" r="60%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>

      {/* ── Crown body: 3 spikes silhouette ── */}
      <path
        d="M10,74 L10,44 L28,58 L61,7 L94,58 L112,44 L112,74 Z"
        fill={`url(#${gradId})`}
      />
      {/* Highlight overlay on crown body */}
      <path
        d="M10,74 L10,44 L28,58 L61,7 L94,58 L112,44 L112,74 Z"
        fill={`url(#hl-${id})`}
      />

      {/* ── Left battlement (Dark Navy) ── */}
      <rect x="27" y="52" width="20" height="22" fill={dotColor} rx="1" />

      {/* ── Right battlement (Dark Navy) ── */}
      <rect x="75" y="52" width="20" height="22" fill={dotColor} rx="1" />

      {/* ── Base podium bar ── */}
      <rect x="5" y="72" width="112" height="22" rx="2" fill={`url(#${gradId})`} />

      {/* ── Bounty coin (dark circle on base) ── */}
      <circle cx="61" cy="83" r="6" fill={dotColor} />
    </svg>
  );
}

/** Full logo using the official logo.png asset */
export function BountixxLogo({
  size = 56,
  showWordmark = false,
  className = "",
}: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`} style={{ lineHeight: 0 }}>
      <Image src="/logo.png" alt="Bountixx" width={size} height={size} priority />
      {showWordmark && (
        <span
          className="font-nunito font-black leading-none select-none"
          style={{ fontSize: size * 0.55, color: "#FF5533", letterSpacing: "-0.01em" }}
        >
          bountixx
        </span>
      )}
    </div>
  );
}

/** Compact text-only wordmark for tight spaces */
export function BountixxWordmark({ size = 20 }: { size?: number }) {
  return (
    <span
      className="font-nunito font-black leading-none select-none"
      style={{ fontSize: size, color: "#FF5533", letterSpacing: "-0.01em" }}
    >
      bountixx
    </span>
  );
}

/**
 * Coin badge with tier-based coloring.
 * bronze  → < 100 coins
 * silver  → 100–499 coins
 * gold    → 500–4999 coins
 * diamond → 5000+ coins
 */
export function CoinBadge({ tier, size = 40, amount, className = "" }: CoinProps) {
  const c = TIER_COLORS[tier];

  return (
    <div
      className={`relative inline-flex items-center gap-2 ${className}`}
      aria-label={`${c.label} tier coin`}
    >
      <div
        className="relative"
        style={{ filter: `drop-shadow(0 0 6px ${c.glow})` }}
      >
        <CrownMark
          size={size}
          crownColor={c.crown}
          crownLight={c.crownLight}
          dotColor={c.dot}
          id={`coin-${tier}`}
        />
        {/* Tier shimmer ring */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${c.crownLight}22, transparent 60%)`,
          }}
          aria-hidden
        />
      </div>

      {amount !== undefined && (
        <div className="flex flex-col leading-none">
          <span
            className="font-orbitron font-bold"
            style={{ fontSize: size * 0.32, color: c.crown }}
          >
            {amount.toLocaleString()}
          </span>
          <span
            className="font-space-mono uppercase tracking-widest"
            style={{ fontSize: size * 0.18, color: `${c.crown}88` }}
          >
            {c.label}
          </span>
        </div>
      )}
    </div>
  );
}

/** Utility: derive coin tier from an amount */
export function getCoinTier(amount: number): CoinTier {
  if (amount >= 5000) return "diamond";
  if (amount >= 500)  return "gold";
  if (amount >= 100)  return "silver";
  return "bronze";
}
