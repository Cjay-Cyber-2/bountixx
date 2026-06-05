"use client";

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
  const h = size;
  const w = size;

  return (
    <div className={`flex items-center gap-3 ${className}`} style={{ lineHeight: 0 }}>
      <img
        src="/logo.png"
        width={w}
        height={h}
        alt="Bountixx Logo"
        className="object-contain"
        style={{ width: w, height: h }}
      />

      {/* ── Wordmark (optional) ── */}
      {showWordmark && (
        <span
          className="font-orbitron font-bold tracking-widest select-none leading-none"
          style={{ fontSize: size * 0.36 }}
        >
          <span style={{ color: "var(--haze)" }}>BOUN</span>
          <span style={{ color: "var(--void)" }}>TI</span>
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
      <span style={{ color: "var(--void)" }}>TI</span>
      <span style={{ color: "var(--crown)" }}>XX</span>
    </span>
  );
}
