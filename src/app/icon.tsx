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
        background: "#0E0818",
        borderRadius: 10,
      }}
    >
      <svg
        width={50}
        height={41}
        viewBox="0 0 122 100"
      >
        {/* Crown body */}
        <path
          d="M10,74 L10,44 L28,58 L61,7 L94,58 L112,44 L112,74 Z"
          fill="#9B6BFF"
        />
        {/* Left battlement cutout */}
        <rect x="27" y="52" width="20" height="22" fill="#0E0818" />
        {/* Right battlement cutout */}
        <rect x="75" y="52" width="20" height="22" fill="#0E0818" />
        {/* Base bar */}
        <rect x="5" y="72" width="112" height="22" fill="#9B6BFF" />
        {/* Bounty coin dot */}
        <circle cx="61" cy="83" r="7" fill="#F0A500" />
      </svg>
    </div>,
    { ...size }
  );
}
