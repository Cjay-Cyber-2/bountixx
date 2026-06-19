"use client";

import { useEffect, useRef, useCallback } from "react";
import {
  arenaCheatMessage,
  arenaWarningMessage,
  buildIntegrityProfile,
  INTEGRITY_TIMING,
  isBlockedBeforeInput,
  isDynamicSidebar,
  readViewSnapshot,
  type ArenaCheatReason,
  type ViewSnapshot,
} from "@/lib/arenaIntegrity";

export type { ArenaCheatReason };
export { arenaCheatMessage };

interface ArenaGuardOptions {
  onStrike: (count: number, reason: ArenaCheatReason) => void;
  onWarning?: (kind: "split-view" | "side-panel" | null, message: string | null) => void;
  onDisqualify?: () => void;
  maxStrikes?: number;
  enabled?: boolean;
}

export function useArenaGuard({
  onStrike,
  onWarning,
  onDisqualify,
  maxStrikes = 1,
  enabled = true,
}: ArenaGuardOptions) {
  const strikeCount = useRef(0);
  const firedRef = useRef(false);

  const blockPaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    if (target && "value" in target) target.value = "";
  }, []);

  const blockBeforeInput = useCallback((e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const event = e.nativeEvent as InputEvent;
    if (isBlockedBeforeInput(event.inputType)) {
      e.preventDefault();
    }
  }, []);

  const blockContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  const blockDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const blockCopy = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let baseline: ViewSnapshot = readViewSnapshot();
    let startedAt = Date.now();
    let baselineReady = false;

    let focusLostAt: number | null = null;
    let splitViewAt: number | null = null;
    let sidebarAt: number | null = null;
    let recoveryAt: number | null = null;

    let warnedSplit = false;
    let warnedSidebar = false;

    let settleTimer: number | null = null;
    let pollTimer: number | null = null;

    function inGracePeriod(): boolean {
      return Date.now() - startedAt < INTEGRITY_TIMING.ENTRY_GRACE_MS;
    }

    function disqualify(reason: ArenaCheatReason) {
      if (firedRef.current) return;
      firedRef.current = true;
      strikeCount.current += 1;
      onStrike(strikeCount.current, reason);
      if (strikeCount.current >= maxStrikes) {
        onDisqualify?.();
      }
    }

    function clearFocusWatch() {
      focusLostAt = null;
    }

    function clearSplitWatch() {
      if (splitViewAt !== null) onWarning?.(null, null);
      splitViewAt = null;
      warnedSplit = false;
    }

    function clearSidebarWatch() {
      if (sidebarAt !== null) onWarning?.(null, null);
      sidebarAt = null;
      warnedSidebar = false;
    }

    function maybeWarn(kind: "split-view" | "side-panel", started: number | null) {
      if (!onWarning || started === null) return;
      const elapsed = Date.now() - started;
      if (elapsed < INTEGRITY_TIMING.WARNING_LEAD_MS) return;
      if (kind === "split-view" && warnedSplit) return;
      if (kind === "side-panel" && warnedSidebar) return;
      if (kind === "split-view") warnedSplit = true;
      if (kind === "side-panel") warnedSidebar = true;
      onWarning(kind, arenaWarningMessage(kind));
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        clearFocusWatch();
        clearSplitWatch();
        clearSidebarWatch();
        disqualify("tab-switch");
      } else {
        clearFocusWatch();
        clearSplitWatch();
        clearSidebarWatch();
      }
    }

    function handleFocusIn() {
      clearFocusWatch();
    }

    function handleFocusOut() {
      if (document.hidden || firedRef.current) return;
      const profile = buildIntegrityProfile(baseline);
      if (profile.keyboardOpen) return;
      focusLostAt = Date.now();
    }

    function handleContextMenu(e: MouseEvent) {
      e.preventDefault();
    }

    function handleBeforeInput(e: Event) {
      const inputEvent = e as InputEvent;
      if (!isBlockedBeforeInput(inputEvent.inputType)) return;
      e.preventDefault();
      if (
        inputEvent.inputType === "insertReplacementText" ||
        inputEvent.inputType === "insertFromDrop"
      ) {
        disqualify("external-input");
      }
    }

    function pollIntegrity() {
      if (firedRef.current || document.hidden || !baselineReady) return;
      if (inGracePeriod()) return;

      const focusLost = !document.hasFocus();
      const profile = buildIntegrityProfile(baseline, { focusLost, hidden: document.hidden });

      if (profile.keyboardOpen) {
        clearFocusWatch();
        clearSplitWatch();
        clearSidebarWatch();
        recoveryAt = null;
        return;
      }

      const splitActive = profile.splitTabLayout;
      const sidebarActive = isDynamicSidebar(profile.snapshot, baseline);

      if (!splitActive && !sidebarActive) {
        if (recoveryAt === null) recoveryAt = Date.now();
        if (Date.now() - recoveryAt >= INTEGRITY_TIMING.RECOVERY_HOLD_MS) {
          clearSplitWatch();
          clearSidebarWatch();
          clearFocusWatch();
          recoveryAt = null;
        }
        return;
      }

      recoveryAt = null;

      if (splitActive) {
        if (splitViewAt === null) splitViewAt = Date.now();
        maybeWarn("split-view", splitViewAt);

        const splitElapsed = Date.now() - splitViewAt;
        const focusElapsed = focusLostAt ? Date.now() - focusLostAt : 0;

        if (
          focusElapsed >= INTEGRITY_TIMING.SPLIT_VIEW_WITH_FOCUS_MS &&
          splitElapsed >= INTEGRITY_TIMING.SPLIT_VIEW_WITH_FOCUS_MS
        ) {
          disqualify("split-view");
          return;
        }

        if (splitElapsed >= INTEGRITY_TIMING.SPLIT_VIEW_MS) {
          disqualify("split-view");
          return;
        }
      } else {
        clearSplitWatch();
      }

      if (sidebarActive) {
        if (sidebarAt === null) sidebarAt = Date.now();
        maybeWarn("side-panel", sidebarAt);

        const sidebarElapsed = Date.now() - sidebarAt;
        const focusElapsed = focusLostAt ? Date.now() - focusLostAt : 0;
        const widthOnlyThreshold =
          focusElapsed >= INTEGRITY_TIMING.SIDE_PANEL_MS
            ? INTEGRITY_TIMING.SIDE_PANEL_MS
            : INTEGRITY_TIMING.SIDE_PANEL_WIDTH_ONLY_MS;

        if (sidebarElapsed >= widthOnlyThreshold) {
          disqualify("side-panel");
          return;
        }
      } else {
        clearSidebarWatch();
      }

      if (!focusLost) {
        clearFocusWatch();
      }
    }

    settleTimer = window.setTimeout(() => {
      baseline = readViewSnapshot();
      baselineReady = true;
    }, INTEGRITY_TIMING.BASELINE_SETTLE_MS);

    pollTimer = window.setInterval(pollIntegrity, INTEGRITY_TIMING.POLL_MS);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocusIn, true);
    window.addEventListener("blur", handleFocusOut, true);
    document.addEventListener("contextmenu", handleContextMenu, true);
    document.addEventListener("beforeinput", handleBeforeInput, true);
    window.visualViewport?.addEventListener("resize", pollIntegrity);
    window.visualViewport?.addEventListener("scroll", pollIntegrity);
    window.addEventListener("resize", pollIntegrity);

    return () => {
      if (settleTimer !== null) window.clearTimeout(settleTimer);
      if (pollTimer !== null) window.clearInterval(pollTimer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocusIn, true);
      window.removeEventListener("blur", handleFocusOut, true);
      document.removeEventListener("contextmenu", handleContextMenu, true);
      document.removeEventListener("beforeinput", handleBeforeInput, true);
      window.visualViewport?.removeEventListener("resize", pollIntegrity);
      window.visualViewport?.removeEventListener("scroll", pollIntegrity);
      window.removeEventListener("resize", pollIntegrity);
    };
  }, [enabled, maxStrikes, onDisqualify, onStrike, onWarning]);

  return {
    blockPaste,
    blockBeforeInput,
    blockContextMenu,
    blockDrop,
    blockCopy,
    strikes: strikeCount,
  };
}
