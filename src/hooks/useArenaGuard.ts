"use client";

import { useEffect, useRef } from "react";

export type ArenaCheatReason = "tab-switch" | "side-panel";

interface ArenaGuardOptions {
  onStrike: (count: number, reason: ArenaCheatReason) => void;
  onDisqualify?: () => void;
  maxStrikes?: number;
  enabled?: boolean;
}

const FOCUS_VIOLATION_MS = 2_800;
const SIDEBAR_VIOLATION_MS = 2_000;
const POLL_MS = 400;
const BASELINE_SETTLE_MS = 900;
const MIN_SIDEBAR_WIDTH_LOSS = 110;

type ViewBaseline = { width: number; height: number };

function readViewport(): ViewBaseline {
  const vv = window.visualViewport;
  return {
    width: vv?.width ?? window.innerWidth,
    height: vv?.height ?? window.innerHeight,
  };
}

function isKeyboardOpen(baseline: ViewBaseline): boolean {
  const current = readViewport();
  return current.height < baseline.height * 0.72 && current.width > baseline.width * 0.88;
}

function sidebarWidthLoss(baseline: ViewBaseline): number {
  const current = readViewport();
  return Math.max(0, baseline.width - current.width);
}

function isSidebarLikely(baseline: ViewBaseline): boolean {
  if (isKeyboardOpen(baseline)) return false;
  const current = readViewport();
  const widthLoss = sidebarWidthLoss(baseline);
  const heightStable = current.height >= baseline.height * 0.8;
  return widthLoss >= MIN_SIDEBAR_WIDTH_LOSS && heightStable;
}

export function arenaCheatMessage(reason: ArenaCheatReason): string {
  if (reason === "tab-switch") {
    return "You left the arena tab. Stay on this page for the whole round.";
  }
  return "An external panel or side tool was detected while the arena is live. Only the arena page is allowed.";
}

export function useArenaGuard({
  onStrike,
  onDisqualify,
  maxStrikes = 1,
  enabled = true,
}: ArenaGuardOptions) {
  const strikeCount = useRef(0);
  const firedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    let baseline = readViewport();
    let focusStartedAt: number | null = null;
    let sidebarStartedAt: number | null = null;
    let settleTimer: number | null = null;
    let pollTimer: number | null = null;

    function disqualify(reason: ArenaCheatReason) {
      if (firedRef.current) return;
      firedRef.current = true;
      strikeCount.current += 1;
      onStrike(strikeCount.current, reason);
      if (strikeCount.current >= maxStrikes) {
        onDisqualify?.();
      }
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        focusStartedAt = null;
        sidebarStartedAt = null;
        disqualify("tab-switch");
      } else {
        focusStartedAt = null;
        sidebarStartedAt = null;
      }
    }

    function clearFocusWatch() {
      focusStartedAt = null;
    }

    function clearSidebarWatch() {
      sidebarStartedAt = null;
    }

    function handleFocusIn() {
      clearFocusWatch();
      clearSidebarWatch();
    }

    function handleFocusOut() {
      if (document.hidden || firedRef.current) return;
      if (isKeyboardOpen(baseline)) return;
      focusStartedAt = Date.now();
    }

    function pollIntegrity() {
      if (firedRef.current || document.hidden) return;

      const keyboardOpen = isKeyboardOpen(baseline);
      const sidebarLikely = isSidebarLikely(baseline);
      const widthLoss = sidebarWidthLoss(baseline);
      const focusLost = !document.hasFocus();

      if (keyboardOpen) {
        clearFocusWatch();
        clearSidebarWatch();
        return;
      }

      if (sidebarLikely) {
        if (sidebarStartedAt === null) sidebarStartedAt = Date.now();
        if (Date.now() - sidebarStartedAt >= SIDEBAR_VIOLATION_MS) {
          disqualify("side-panel");
          return;
        }
      } else {
        clearSidebarWatch();
      }

      if (focusLost && widthLoss >= 60) {
        if (focusStartedAt === null) focusStartedAt = Date.now();
        if (Date.now() - focusStartedAt >= FOCUS_VIOLATION_MS) {
          disqualify("side-panel");
        }
        return;
      }

      if (!focusLost) {
        clearFocusWatch();
      }
    }

    settleTimer = window.setTimeout(() => {
      baseline = readViewport();
    }, BASELINE_SETTLE_MS);

    pollTimer = window.setInterval(pollIntegrity, POLL_MS);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocusIn, true);
    window.addEventListener("blur", handleFocusOut, true);
    window.visualViewport?.addEventListener("resize", pollIntegrity);
    window.visualViewport?.addEventListener("scroll", pollIntegrity);

    return () => {
      if (settleTimer !== null) window.clearTimeout(settleTimer);
      if (pollTimer !== null) window.clearInterval(pollTimer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocusIn, true);
      window.removeEventListener("blur", handleFocusOut, true);
      window.visualViewport?.removeEventListener("resize", pollIntegrity);
      window.visualViewport?.removeEventListener("scroll", pollIntegrity);
    };
  }, [enabled, maxStrikes, onDisqualify, onStrike]);

  function blockPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    if (target && "value" in target) target.value = "";
  }

  return { blockPaste, strikes: strikeCount };
}
