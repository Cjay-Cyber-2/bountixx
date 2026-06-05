"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";
import { gsap } from "gsap";
import "./TargetCursor.css";

/**
 * Finds the nearest ancestor that establishes a containing block for
 * position: fixed elements (transform, perspective, filter, will-change, contain).
 */
const getContainingBlock = (element: HTMLElement | null): HTMLElement | null => {
  let node = element?.parentElement ?? null;
  while (node && node !== document.documentElement) {
    const style = getComputedStyle(node);
    if (
      style.transform !== "none" ||
      style.perspective !== "none" ||
      style.filter !== "none" ||
      style.willChange.includes("transform") ||
      style.willChange.includes("perspective") ||
      style.willChange.includes("filter") ||
      /paint|layout|strict|content/.test(style.contain)
    ) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
};

const getContainingBlockOffset = (block: HTMLElement | null) => {
  if (!block) return { x: 0, y: 0 };
  const rect = block.getBoundingClientRect();
  return { x: rect.left + block.clientLeft, y: rect.top + block.clientTop };
};

interface TargetCursorProps {
  targetSelector?: string;
  spinDuration?: number;
  hideDefaultCursor?: boolean;
  hoverDuration?: number;
  parallaxOn?: boolean;
}

function TargetCursor({
  targetSelector = ".cursor-target",
  spinDuration = 4,
  hideDefaultCursor = true,
  hoverDuration = 0.2,
  parallaxOn = true,
}: TargetCursorProps) {
  const cursorRef = useRef<HTMLDivElement>(null);
  const arrowsRef = useRef<HTMLDivElement[]>([]);
  const ringRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const containingBlockRef = useRef<HTMLElement | null>(null);

  const isActiveRef = useRef(false);
  const targetArrowPositionsRef = useRef<{ x: number; y: number }[] | null>(null);
  const tickerFnRef = useRef<(() => void) | null>(null);
  const activeStrengthRef = useRef({ current: 0 });

  const isMobile = useMemo(() => {
    if (typeof window === "undefined") return false;
    const hasTouchScreen =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const isSmallScreen = window.innerWidth <= 768;
    const userAgent = navigator.userAgent || navigator.vendor || "";
    const mobileRegex =
      /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
    const isMobileUserAgent = mobileRegex.test(userAgent.toLowerCase());
    return (hasTouchScreen && isSmallScreen) || isMobileUserAgent;
  }, []);

  const constants = useMemo(
    () => ({
      arrowOffset: 8,
      arrowSize: 6,
    }),
    []
  );

  const moveCursor = useCallback((x: number, y: number) => {
    if (!cursorRef.current) return;
    const { x: offsetX, y: offsetY } = getContainingBlockOffset(
      containingBlockRef.current
    );
    gsap.to(cursorRef.current, {
      x: x - offsetX,
      y: y - offsetY,
      duration: 0.12,
      ease: "power3.out",
    });
  }, []);

  useEffect(() => {
    if (isMobile || !cursorRef.current) return;

    const originalCursor = document.body.style.cursor;
    if (hideDefaultCursor) {
      document.body.style.cursor = "none";

      // Also hide cursor on all interactive elements
      const style = document.createElement("style");
      style.id = "bountixx-cursor-hide";
      style.textContent = `*, *::before, *::after { cursor: none !important; }`;
      document.head.appendChild(style);
    }

    const cursor = cursorRef.current;
    const arrows = arrowsRef.current;

    containingBlockRef.current = getContainingBlock(cursor);
    const getOffset = () =>
      getContainingBlockOffset(containingBlockRef.current);

    let activeTarget: HTMLElement | null = null;
    let currentLeaveHandler: (() => void) | null = null;
    let resumeTimeout: ReturnType<typeof setTimeout> | null = null;

    const cleanupTarget = (target: HTMLElement) => {
      if (currentLeaveHandler) {
        target.removeEventListener("mouseleave", currentLeaveHandler);
      }
      currentLeaveHandler = null;
    };

    const initialOffset = getOffset();
    gsap.set(cursor, {
      xPercent: -50,
      yPercent: -50,
      x: window.innerWidth / 2 - initialOffset.x,
      y: window.innerHeight / 2 - initialOffset.y,
    });

    // Ticker function for parallax tracking
    const tickerFn = () => {
      if (
        !targetArrowPositionsRef.current ||
        !cursorRef.current ||
        !arrows.length
      ) {
        return;
      }

      const strength = activeStrengthRef.current.current;
      if (strength === 0) return;

      const cursorX = gsap.getProperty(cursorRef.current, "x") as number;
      const cursorY = gsap.getProperty(cursorRef.current, "y") as number;

      arrows.forEach((arrow, i) => {
        const currentX = gsap.getProperty(arrow, "x") as number;
        const currentY = gsap.getProperty(arrow, "y") as number;

        const targetX = targetArrowPositionsRef.current![i].x - cursorX;
        const targetY = targetArrowPositionsRef.current![i].y - cursorY;

        const finalX = currentX + (targetX - currentX) * strength;
        const finalY = currentY + (targetY - currentY) * strength;

        const duration = strength >= 0.99 ? (parallaxOn ? 0.2 : 0) : 0.05;

        gsap.to(arrow, {
          x: finalX,
          y: finalY,
          duration: duration,
          ease: duration === 0 ? "none" : "power1.out",
          overwrite: "auto",
        });
      });
    };

    tickerFnRef.current = tickerFn;

    const moveHandler = (e: MouseEvent) => moveCursor(e.clientX, e.clientY);
    window.addEventListener("mousemove", moveHandler);

    const scrollHandler = () => {
      if (!activeTarget || !cursorRef.current) return;
      const { x: offsetX, y: offsetY } = getOffset();
      const mouseX =
        (gsap.getProperty(cursorRef.current, "x") as number) + offsetX;
      const mouseY =
        (gsap.getProperty(cursorRef.current, "y") as number) + offsetY;
      const elementUnderMouse = document.elementFromPoint(mouseX, mouseY);
      const isStillOverTarget =
        elementUnderMouse &&
        (elementUnderMouse === activeTarget ||
          (elementUnderMouse as HTMLElement).closest(targetSelector) ===
            activeTarget);
      if (!isStillOverTarget) {
        if (currentLeaveHandler) {
          currentLeaveHandler();
        }
      }
    };
    window.addEventListener("scroll", scrollHandler, { passive: true });

    const mouseDownHandler = () => {
      if (!orbRef.current) return;
      gsap.to(orbRef.current, { scale: 0.5, duration: 0.15 });
      gsap.to(cursor, { scale: 0.9, duration: 0.15 });
    };

    const mouseUpHandler = () => {
      if (!orbRef.current) return;
      gsap.to(orbRef.current, { scale: 1, duration: 0.3 });
      gsap.to(cursor, { scale: 1, duration: 0.3 });
    };

    window.addEventListener("mousedown", mouseDownHandler);
    window.addEventListener("mouseup", mouseUpHandler);

    const enterHandler = (e: MouseEvent) => {
      const directTarget = e.target as HTMLElement;
      const allTargets: HTMLElement[] = [];
      let current: HTMLElement | null = directTarget;
      while (current && current !== document.body) {
        if (current.matches(targetSelector)) {
          allTargets.push(current);
        }
        current = current.parentElement;
      }
      const target = allTargets[0] || null;
      if (!target || !cursorRef.current || !arrows.length) return;
      if (activeTarget === target) return;
      if (activeTarget) {
        cleanupTarget(activeTarget);
      }
      if (resumeTimeout) {
        clearTimeout(resumeTimeout);
        resumeTimeout = null;
      }

      activeTarget = target;
      arrows.forEach((arrow) => gsap.killTweensOf(arrow));

      // Pause ring spin and scale it to wrap the target
      if (ringRef.current) {
        gsap.to(ringRef.current, {
          opacity: 0,
          scale: 0.5,
          duration: 0.15,
        });
      }

      // Glow the orb
      if (orbRef.current) {
        gsap.to(orbRef.current, {
          boxShadow:
            "0 0 12px rgba(168, 85, 247, 0.8), 0 0 30px rgba(132, 0, 255, 0.4)",
          scale: 1.3,
          duration: 0.2,
        });
      }

      const rect = target.getBoundingClientRect();
      const pad = 6;
      const { x: offsetX, y: offsetY } = getOffset();
      const cursorX = gsap.getProperty(cursorRef.current, "x") as number;
      const cursorY = gsap.getProperty(cursorRef.current, "y") as number;

      // Arrow positions: top-center, right-center, bottom-center, left-center of target
      targetArrowPositionsRef.current = [
        {
          x: rect.left + rect.width / 2 - offsetX,
          y: rect.top - pad - offsetY,
        }, // top
        {
          x: rect.right + pad - offsetX,
          y: rect.top + rect.height / 2 - offsetY,
        }, // right
        {
          x: rect.left + rect.width / 2 - offsetX,
          y: rect.bottom + pad - offsetY,
        }, // bottom
        {
          x: rect.left - pad - offsetX,
          y: rect.top + rect.height / 2 - offsetY,
        }, // left
      ];

      isActiveRef.current = true;
      gsap.ticker.add(tickerFnRef.current!);

      gsap.to(activeStrengthRef.current, {
        current: 1,
        duration: hoverDuration,
        ease: "power2.out",
      });

      arrows.forEach((arrow, i) => {
        gsap.to(arrow, {
          x: targetArrowPositionsRef.current![i].x - cursorX,
          y: targetArrowPositionsRef.current![i].y - cursorY,
          opacity: 1,
          duration: 0.25,
          ease: "power2.out",
        });
      });

      const leaveHandler = () => {
        gsap.ticker.remove(tickerFnRef.current!);

        isActiveRef.current = false;
        targetArrowPositionsRef.current = null;
        gsap.set(activeStrengthRef.current, { current: 0 });
        activeTarget = null;

        // Restore ring
        if (ringRef.current) {
          gsap.to(ringRef.current, {
            opacity: 1,
            scale: 1,
            duration: 0.3,
          });
        }

        // Restore orb
        if (orbRef.current) {
          gsap.to(orbRef.current, {
            boxShadow:
              "0 0 8px rgba(168, 85, 247, 0.6), 0 0 20px rgba(168, 85, 247, 0.25)",
            scale: 1,
            duration: 0.3,
          });
        }

        // Retract arrows
        if (arrows.length) {
          const positions = [
            { x: 0, y: -18 },
            { x: 18, y: 0 },
            { x: 0, y: 18 },
            { x: -18, y: 0 },
          ];
          arrows.forEach((arrow, index) => {
            gsap.to(arrow, {
              x: positions[index].x,
              y: positions[index].y,
              opacity: 0,
              duration: 0.25,
              ease: "power3.out",
            });
          });
        }

        cleanupTarget(target);
      };

      currentLeaveHandler = leaveHandler;
      target.addEventListener("mouseleave", leaveHandler);
    };

    window.addEventListener("mouseover", enterHandler, { passive: true });

    const resizeHandler = () => {
      containingBlockRef.current = getContainingBlock(cursor);
    };
    window.addEventListener("resize", resizeHandler);

    return () => {
      if (tickerFnRef.current) {
        gsap.ticker.remove(tickerFnRef.current);
      }

      window.removeEventListener("mousemove", moveHandler);
      window.removeEventListener("mouseover", enterHandler);
      window.removeEventListener("scroll", scrollHandler);
      window.removeEventListener("resize", resizeHandler);
      window.removeEventListener("mousedown", mouseDownHandler);
      window.removeEventListener("mouseup", mouseUpHandler);

      if (activeTarget) {
        cleanupTarget(activeTarget);
      }

      document.body.style.cursor = originalCursor;
      const styleEl = document.getElementById("bountixx-cursor-hide");
      if (styleEl) styleEl.remove();

      isActiveRef.current = false;
      targetArrowPositionsRef.current = null;
      activeStrengthRef.current.current = 0;
    };
  }, [
    targetSelector,
    spinDuration,
    moveCursor,
    constants,
    hideDefaultCursor,
    isMobile,
    hoverDuration,
    parallaxOn,
  ]);

  if (isMobile) {
    return null;
  }

  return (
    <div ref={cursorRef} className="target-cursor-wrapper">
      <div ref={orbRef} className="target-cursor-orb" />
      <div ref={ringRef} className="target-cursor-ring" />
      <div
        ref={(el) => {
          if (el) arrowsRef.current[0] = el;
        }}
        className="target-cursor-arrow arrow-top"
        style={{ opacity: 0 }}
      />
      <div
        ref={(el) => {
          if (el) arrowsRef.current[1] = el;
        }}
        className="target-cursor-arrow arrow-right"
        style={{ opacity: 0 }}
      />
      <div
        ref={(el) => {
          if (el) arrowsRef.current[2] = el;
        }}
        className="target-cursor-arrow arrow-bottom"
        style={{ opacity: 0 }}
      />
      <div
        ref={(el) => {
          if (el) arrowsRef.current[3] = el;
        }}
        className="target-cursor-arrow arrow-left"
        style={{ opacity: 0 }}
      />
    </div>
  );
}

/** Wrapper that only renders on the client to avoid SSR hydration issues */
export function TargetCursorWrapper() {
  return <TargetCursor />;
}

export default TargetCursor;
