"use client";

/**
 * Custom cursor — robust + minimal.
 *
 * Idle: a soft ring + dot trailing the pointer.
 * Hover: a single bordered frame snaps to the hovered interactive element.
 *   Hover state is recomputed on every mousemove (via closest()), so the frame
 *   can never get "stuck" around an element you've already left.
 * Press: while the mouse is down over a target, the frame fills and glows —
 *   a clear, visible "this is what you're about to click".
 */

import { useEffect, useRef, useMemo } from "react";
import "./TargetCursor.css";

const SELECTOR =
  '.cursor-target, a[href], button:not([disabled]), [role="button"], input:not([type="hidden"]):not(.bx-native-cursor), select, summary, label[for]';

export function TargetCursorWrapper() {
  const rootRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  const isTouch = useMemo(() => {
    if (typeof window === "undefined") return false;
    const coarse = window.matchMedia?.("(pointer: coarse)")?.matches;
    return coarse || "ontouchstart" in window || navigator.maxTouchPoints > 0;
  }, []);

  useEffect(() => {
    if (isTouch) return;
    const root = rootRef.current;
    const ring = ringRef.current;
    const dot = dotRef.current;
    const frame = frameRef.current;
    if (!root || !ring || !dot || !frame) return;

    // Hide the native cursor except in text-editing zones (code editor, answer fields)
    const styleEl = document.createElement("style");
    styleEl.id = "bx-cursor-hide";
    styleEl.textContent = `
      html:not(.bx-native-cursor-active) *,
      html:not(.bx-native-cursor-active) *::before,
      html:not(.bx-native-cursor-active) *::after {
        cursor: none !important;
      }
      .bx-native-cursor,
      .bx-native-cursor * {
        cursor: text !important;
      }
      textarea.bx-native-cursor,
      input.bx-native-cursor,
      .bx-native-cursor textarea,
      .bx-native-cursor input {
        cursor: text !important;
        caret-color: #c4b5fd !important;
      }
      .bx-native-cursor textarea::selection,
      .bx-native-cursor input::selection,
      textarea.bx-native-cursor::selection,
      input.bx-native-cursor::selection {
        background: rgba(124, 92, 255, 0.55) !important;
        color: #ffffff !important;
      }
    `;
    document.head.appendChild(styleEl);

    let px = window.innerWidth / 2;
    let py = window.innerHeight / 2;
    let rx = px;
    let ry = py;
    let dx = px;
    let dy = py;
    let raf = 0;
    let current: HTMLElement | null = null;

    const loop = () => {
      rx += (px - rx) * 0.2;
      ry += (py - ry) * 0.2;
      dx += (px - dx) * 0.38;
      dy += (py - dy) * 0.38;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      dot.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const frameToTarget = (t: HTMLElement) => {
      const r = t.getBoundingClientRect();
      const pad = 5;
      const radius = parseFloat(getComputedStyle(t).borderTopLeftRadius) || 6;
      frame.style.left = `${r.left - pad}px`;
      frame.style.top = `${r.top - pad}px`;
      frame.style.width = `${r.width + pad * 2}px`;
      frame.style.height = `${r.height + pad * 2}px`;
      frame.style.borderRadius = `${Math.min(radius + pad, 22)}px`;
    };

    const setTarget = (t: HTMLElement | null) => {
      if (t === current) {
        if (t) frameToTarget(t); // keep glued if layout shifts
        return;
      }
      current = t;
      if (t) {
        frameToTarget(t);
        root.classList.add("is-hovering");
      } else {
        root.classList.remove("is-hovering");
      }
    };

    const setNativeActive = (active: boolean) => {
      document.documentElement.classList.toggle("bx-native-cursor-active", active);
      if (active) {
        root.classList.add("is-hidden");
        setTarget(null);
      }
    };

    const onMove = (e: MouseEvent) => {
      px = e.clientX;
      py = e.clientY;
      const el = e.target as Element | null;
      const overNative = el?.closest?.(".bx-native-cursor");
      const focusInNative = document.activeElement?.closest?.(".bx-native-cursor");
      if (overNative || focusInNative) {
        setNativeActive(true);
        return;
      }
      setNativeActive(false);
      if (root.classList.contains("is-hidden")) root.classList.remove("is-hidden");
      const t = (el?.closest?.(SELECTOR) as HTMLElement) || null;
      setTarget(t && !t.hasAttribute("disabled") ? t : null);
    };

    const onFocusIn = (e: FocusEvent) => {
      if ((e.target as Element | null)?.closest?.(".bx-native-cursor")) {
        setNativeActive(true);
      }
    };
    const onFocusOut = (e: FocusEvent) => {
      const next = e.relatedTarget as Element | null;
      if (!next?.closest?.(".bx-native-cursor")) {
        setNativeActive(false);
      }
    };

    const onDown = () => root.classList.add("is-pressing");
    const onUp = () => root.classList.remove("is-pressing");
    const onLeave = () => {
      root.classList.add("is-hidden");
      setTarget(null);
    };
    const onSync = () => {
      if (current && document.contains(current)) frameToTarget(current);
      else setTarget(null);
    };

    window.addEventListener("mousemove", onMove);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("blur", onUp);
    document.addEventListener("mouseleave", onLeave);
    window.addEventListener("scroll", onSync, { passive: true });
    window.addEventListener("resize", onSync);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("blur", onUp);
      document.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("scroll", onSync);
      window.removeEventListener("resize", onSync);
      styleEl.remove();
      document.documentElement.classList.remove("bx-native-cursor-active");
    };
  }, [isTouch]);

  if (isTouch) return null;

  return (
    <div ref={rootRef} className="bx-cursor-root" aria-hidden>
      <div ref={ringRef} className="bx-cursor-ring" />
      <div ref={dotRef} className="bx-cursor-dot" />
      <div ref={frameRef} className="bx-cursor-frame" />
    </div>
  );
}

export default TargetCursorWrapper;
