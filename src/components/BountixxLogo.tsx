"use client";

type CoinTier = "bronze" | "silver" | "gold" | "diamond";

interface LogoProps {
  size?: number;
  showWordmark?: boolean;
  className?: string;
}

interface CoinProps {
  tier: CoinTier;
  size?: number;
  amount?: number;
  className?: string;
}

const TIER_COLORS: Record<
  CoinTier,
  { face1: string; face2: string; edge: string; shine: string; emboss: string; text: string; glow: string; label: string }
> = {
  bronze: {
    face1:  "#C47A3A",
    face2:  "#A05C20",
    edge:   "#7A3A10",
    shine:  "rgba(255,200,130,0.55)",
    emboss: "rgba(90,40,5,0.60)",
    text:   "#E89050",
    glow:   "rgba(196,122,58,0.45)",
    label:  "Bronze",
  },
  silver: {
    face1:  "#D8D8D8",
    face2:  "#A8A8A8",
    edge:   "#787878",
    shine:  "rgba(255,255,255,0.60)",
    emboss: "rgba(80,80,80,0.50)",
    text:   "#C8C8C8",
    glow:   "rgba(168,168,168,0.40)",
    label:  "Silver",
  },
  gold: {
    face1:  "#F5C842",
    face2:  "#C88A00",
    edge:   "#996800",
    shine:  "rgba(255,240,160,0.60)",
    emboss: "rgba(100,60,0,0.55)",
    text:   "#F0A500",
    glow:   "rgba(240,165,0,0.50)",
    label:  "Gold",
  },
  diamond: {
    face1:  "#7DD3FC",
    face2:  "#0EA5E9",
    edge:   "#0369A1",
    shine:  "rgba(220,240,255,0.65)",
    emboss: "rgba(2,60,100,0.55)",
    text:   "#38BDF8",
    glow:   "rgba(125,211,252,0.50)",
    label:  "Diamond",
  },
};

/**
 * Core crown mark — inline SVG, the official Bountixx brand icon.
 * Coral body (#FF5533 / #FF7A5C), deep navy (#111B56) battlements.
 * Matches the PDF brand guide exactly.
 */
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
  const w = size * 1.22;

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
        <linearGradient id={gradId} x1="61" y1="5" x2="61" y2="94" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor={crownLight} />
          <stop offset="45%"  stopColor={crownColor} />
          <stop offset="100%" stopColor={crownColor} stopOpacity="0.92" />
        </linearGradient>
      </defs>

      {/* Crown body — 3 spikes + fill */}
      <path
        d="M10,74 L10,44 L28,58 L61,7 L94,58 L112,44 L112,74 Z"
        fill={`url(#${gradId})`}
      />

      {/* Left battlement cutout */}
      <rect x="27" y="51" width="20" height="23" fill={dotColor} rx="1" />

      {/* Right battlement cutout */}
      <rect x="75" y="51" width="20" height="23" fill={dotColor} rx="1" />

      {/* Base bar */}
      <rect x="5" y="72" width="112" height="22" rx="2" fill={`url(#${gradId})`} />

      {/* Bounty coin dot on base */}
      <circle cx="61" cy="83" r="6.5" fill={dotColor} />
    </svg>
  );
}

/** Full logo: crown mark + optional wordmark */
export function BountixxLogo({
  size = 40,
  showWordmark = false,
  className = "",
}: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`} style={{ lineHeight: 0 }}>
      <CrownMark size={size} id="nav" />
      {showWordmark && (
        <span
          className="font-nunito font-black leading-none select-none tracking-tight"
          style={{ fontSize: size * 0.5, color: "#FF5533" }}
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
      className="font-nunito font-black leading-none select-none tracking-tight"
      style={{ fontSize: size, color: "#FF5533" }}
    >
      bountixx
    </span>
  );
}

/**
 * Coin badge — renders an actual circular coin with metallic shading.
 * Changes tier based on user's coin balance:
 *   bronze  < 100 · silver 100-499 · gold 500-4999 · diamond 5000+
 */
export function CoinBadge({ tier, size = 40, amount, className = "" }: CoinProps) {
  const c = TIER_COLORS[tier];
  const r = size / 2;
  const rFace = r * 0.88;
  const rInner = r * 0.72;
  const gradFaceId = `cf-${tier}`;
  const gradShineId = `cs-${tier}`;
  const gradEmbossId = `ce-${tier}`;

  return (
    <div
      className={`relative inline-flex items-center gap-2 ${className}`}
      aria-label={`${c.label} tier coin`}
    >
      <div className="relative shrink-0" style={{ filter: `drop-shadow(0 2px 8px ${c.glow})` }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
          <defs>
            <radialGradient id={gradFaceId} cx="38%" cy="32%" r="62%">
              <stop offset="0%"   stopColor={c.face1} />
              <stop offset="100%" stopColor={c.face2} />
            </radialGradient>
            <radialGradient id={gradShineId} cx="30%" cy="25%" r="55%">
              <stop offset="0%"   stopColor={c.shine} />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
            <radialGradient id={gradEmbossId} cx="65%" cy="70%" r="55%">
              <stop offset="0%"   stopColor={c.emboss} />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
          </defs>

          {/* Outer edge ring */}
          <circle cx={r} cy={r} r={r - 0.5} fill={c.edge} />

          {/* Coin face */}
          <circle cx={r} cy={r} r={rFace} fill={`url(#${gradFaceId})`} />

          {/* Inner rim */}
          <circle cx={r} cy={r} r={rInner} fill="none" stroke={c.edge} strokeWidth="0.8" strokeOpacity="0.5" />

          {/* Emboss shadow for 3D depth */}
          <circle cx={r} cy={r} r={rFace} fill={`url(#${gradEmbossId})`} />

          {/* Shine highlight */}
          <circle cx={r} cy={r} r={rFace} fill={`url(#${gradShineId})`} />

          {/* Crown mark embossed in center */}
          <CrownEmboss cx={r} cy={r} size={size * 0.42} tier={tier} edgeColor={c.edge} faceColor={c.face2} />
        </svg>
      </div>

      {amount !== undefined && (
        <div className="flex flex-col leading-none gap-0.5">
          <span
            className="font-orbitron font-bold tabular-nums"
            style={{ fontSize: size * 0.32, color: c.text }}
          >
            {amount.toLocaleString()}
          </span>
          <span
            className="font-space-mono uppercase tracking-widest"
            style={{ fontSize: size * 0.175, color: `${c.text}88` }}
          >
            {c.label}
          </span>
        </div>
      )}
    </div>
  );
}

/** Mini crown SVG rendered directly inside the coin face, centered at (cx, cy) */
function CrownEmboss({
  cx,
  cy,
  size,
  tier,
  edgeColor,
  faceColor,
}: {
  cx: number;
  cy: number;
  size: number;
  tier: CoinTier;
  edgeColor: string;
  faceColor: string;
}) {
  const w = size * 1.22;
  const h = size;
  const x = cx - w / 2;
  const y = cy - h / 2 + size * 0.04;

  return (
    <g transform={`translate(${x}, ${y})`}>
      <svg
        width={w}
        height={h}
        viewBox="0 0 122 100"
        fill="none"
      >
        {/* Crown body as emboss (slightly lighter than face) */}
        <path
          d="M10,74 L10,44 L28,58 L61,7 L94,58 L112,44 L112,74 Z"
          fill={edgeColor}
          opacity="0.55"
        />
        <rect x="27" y="51" width="20" height="23" fill={faceColor} opacity="0.7" rx="1" />
        <rect x="75" y="51" width="20" height="23" fill={faceColor} opacity="0.7" rx="1" />
        <rect x="5" y="72" width="112" height="22" fill={edgeColor} opacity="0.55" rx="2" />
        <circle cx="61" cy="83" r="6.5" fill={faceColor} opacity="0.7" />
      </svg>
    </g>
  );
}

/** Utility: derive coin tier from an amount */
export function getCoinTier(amount: number): CoinTier {
  if (amount >= 5000) return "diamond";
  if (amount >= 500)  return "gold";
  if (amount >= 100)  return "silver";
  return "bronze";
}
