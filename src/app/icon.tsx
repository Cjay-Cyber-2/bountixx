import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: 64,
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0C1340",
        borderRadius: 12,
      }}
    >
      <svg width={50} height={41} viewBox="0 0 122 100">
        <defs>
          <linearGradient id="cg" x1="61" y1="5" x2="61" y2="94" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FF7A5C" />
            <stop offset="50%" stopColor="#FF5533" />
            <stop offset="100%" stopColor="#FF5533" stopOpacity="0.92" />
          </linearGradient>
        </defs>
        {/* Crown body */}
        <path d="M10,74 L10,44 L28,58 L61,7 L94,58 L112,44 L112,74 Z" fill="url(#cg)" />
        {/* Left battlement */}
        <rect x="27" y="51" width="20" height="23" fill="#111B56" rx="1" />
        {/* Right battlement */}
        <rect x="75" y="51" width="20" height="23" fill="#111B56" rx="1" />
        {/* Base bar */}
        <rect x="5" y="72" width="112" height="22" fill="url(#cg)" rx="2" />
        {/* Coin dot */}
        <circle cx="61" cy="83" r="6.5" fill="#111B56" />
      </svg>
    </div>,
    { ...size }
  );
}
