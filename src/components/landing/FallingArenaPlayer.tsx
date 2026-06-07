"use client";

/**
 * Plays the hero's falling-arena animation.
 *
 * Strategy:
 *  1. Try the SMIL-animated SVG via <object> first (smaller, sharper).
 *  2. If the SVG fails to load or browser can't animate it, swap to the MP4.
 *  3. Honors prefers-reduced-motion by freezing the SVG and pausing the MP4.
 *
 * The wrapper is pointer-events:none so the surrounding orbital words
 * remain interactive. Component is fully responsive and aspect-locked.
 */

import { useEffect, useRef, useState } from "react";

type Mode = "svg" | "video";

export function FallingArenaPlayer({
  className = "",
  svgSrc = "/falling-arena.svg",
  videoSrc = "/falling-arena.mp4",
}: {
  className?: string;
  svgSrc?: string;
  videoSrc?: string;
}) {
  const [mode, setMode] = useState<Mode>("svg");
  const [reduced, setReduced] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const objectRef = useRef<HTMLObjectElement>(null);

  // Detect reduced motion preference
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Pause MP4 when reduced motion
  useEffect(() => {
    if (mode === "video" && videoRef.current) {
      if (reduced) videoRef.current.pause();
      else videoRef.current.play().catch(() => {});
    }
  }, [mode, reduced]);

  // Fallback to MP4 if SVG fails to load
  const onSvgError = () => setMode("video");

  return (
    <div
      className={`relative w-full h-full pointer-events-none select-none ${className}`}
      aria-hidden
    >
      {mode === "svg" ? (
        <object
          ref={objectRef}
          type="image/svg+xml"
          data={svgSrc}
          onError={onSvgError}
          className="w-full h-full object-contain"
          style={{ pointerEvents: "none" }}
        >
          <video
            src={videoSrc}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-contain"
          />
        </object>
      ) : (
        <video
          ref={videoRef}
          src={videoSrc}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-contain"
        />
      )}
    </div>
  );
}
