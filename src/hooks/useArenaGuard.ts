"use client";

import { useEffect, useRef, useCallback } from "react";
import {
  arenaCheatMessage,
  arenaWarningMessage,
  buildIntegrityProfile,
  INTEGRITY_TIMING,
  isBlockedBeforeInput,
  isDevToolsOpen,
  isDynamicSidebar,
  readViewSnapshot,
  type ArenaCheatReason,
  type ViewSnapshot,
} from "@/lib/arenaIntegrity";

export type { ArenaCheatReason };
export { arenaCheatMessage };

interface ArenaGuardOptions {
  onStrike: (count: number, reason: ArenaCheatReason) => void;
  onWarning?: (
    kind: "split-view" | "side-panel" | "window-blur" | "devtools" | null,
    message: string | null,
  ) => void;
  onDisqualify?: () => void;
  maxStrikes?: number;
  enabled?: boolean;
}

/** Sentinel value persisted to localStorage to detect a second arena window. */
const ARENA_LOCK_KEY = "bountixx:arena-lock";

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
    let devtoolsAt: number | null = null;

    let warnedSplit = false;
    let warnedSidebar = false;
    let warnedBlur = false;
    let warnedDevtools = false;

    let settleTimer: number | null = null;
    let pollTimer: number | null = null;
    let lockTimer: number | null = null;

    /** Unique token to claim the arena lock — detects a second arena tab. */
    const lockId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    try {
      window.localStorage.setItem(ARENA_LOCK_KEY, lockId);
    } catch {
      // localStorage unavailable — skip the second-window guard
    }

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
      if (focusLostAt !== null && warnedBlur) onWarning?.(null, null);
      focusLostAt = null;
      warnedBlur = false;
    }

    function clearSplitWatch() {
      if (splitViewAt !== null && warnedSplit) onWarning?.(null, null);
      splitViewAt = null;
      warnedSplit = false;
    }

    function clearSidebarWatch() {
      if (sidebarAt !== null && warnedSidebar) onWarning?.(null, null);
      sidebarAt = null;
      warnedSidebar = false;
    }

    function clearDevtoolsWatch() {
      if (devtoolsAt !== null && warnedDevtools) onWarning?.(null, null);
      devtoolsAt = null;
      warnedDevtools = false;
    }

    function maybeWarn(
      kind: "split-view" | "side-panel" | "window-blur" | "devtools",
      started: number | null,
    ) {
      if (!onWarning || started === null) return;
      const elapsed = Date.now() - started;
      if (elapsed < INTEGRITY_TIMING.WARNING_LEAD_MS) return;
      if (kind === "split-view" && warnedSplit) return;
      if (kind === "side-panel" && warnedSidebar) return;
      if (kind === "window-blur" && warnedBlur) return;
      if (kind === "devtools" && warnedDevtools) return;
      if (kind === "split-view") warnedSplit = true;
      if (kind === "side-panel") warnedSidebar = true;
      if (kind === "window-blur") warnedBlur = true;
      if (kind === "devtools") warnedDevtools = true;
      onWarning(kind, arenaWarningMessage(kind));
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        clearFocusWatch();
        clearSplitWatch();
        clearSidebarWatch();
        clearDevtoolsWatch();
        if (!inGracePeriod()) disqualify("tab-switch");
      } else {
        clearFocusWatch();
        clearSplitWatch();
        clearSidebarWatch();
        clearDevtoolsWatch();
      }
    }

    function handleFocusIn() {
      clearFocusWatch();
    }

    function handleFocusOut() {
      if (document.hidden || firedRef.current) return;
      const profile = buildIntegrityProfile(baseline);
      if (profile.keyboardOpen) return;
      if (focusLostAt === null) focusLostAt = Date.now();
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

    /**
     * Block keyboard shortcuts that could open a new tab/window/devtools.
     * The browser still owns these — we can't truly block Ctrl+T on most platforms —
     * but we strike immediately if they fire. Together with the visibility
     * watchdog this ensures any tab-opening shortcut results in disqualification.
     */
    function handleKeyDown(e: KeyboardEvent) {
      if (firedRef.current || inGracePeriod()) return;
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      const isForbiddenCombo =
        (mod && (key === "t" || key === "n" || key === "w")) ||
        (mod && e.shiftKey && (key === "t" || key === "n" || key === "p")) ||
        // DevTools shortcuts
        key === "f12" ||
        (mod && e.shiftKey && (key === "i" || key === "j" || key === "c")) ||
        (mod && key === "u");
      if (isForbiddenCombo) {
        e.preventDefault();
        // Surface a strike immediately — the browser may still execute on some OS.
        disqualify(
          key === "f12" || (mod && e.shiftKey && (key === "i" || key === "j" || key === "c")) || (mod && key === "u")
            ? "devtools"
            : "new-window",
        );
      }
    }

    function handleStorage(e: StorageEvent) {
      if (e.key !== ARENA_LOCK_KEY) return;
      if (e.newValue && e.newValue !== lockId) {
        disqualify("new-window");
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
        clearDevtoolsWatch();
        recoveryAt = null;
        return;
      }

      const splitActive = profile.splitTabLayout;
      const sidebarActive = isDynamicSidebar(profile.snapshot, baseline);
      const devtoolsActive = isDevToolsOpen(profile.snapshot, baseline);

      // DevTools docked is an immediate concern — show warning + strike on sustained.
      if (devtoolsActive) {
        if (devtoolsAt === null) devtoolsAt = Date.now();
        maybeWarn("devtools", devtoolsAt);
        if (Date.now() - devtoolsAt >= INTEGRITY_TIMING.DEVTOOLS_MS) {
          disqualify("devtools");
          return;
        }
      } else {
        clearDevtoolsWatch();
      }

      // Pure focus loss (no split or sidebar) — strike when sustained.
      if (focusLost && !splitActive && !sidebarActive && !devtoolsActive) {
        if (focusLostAt === null) focusLostAt = Date.now();
        maybeWarn("window-blur", focusLostAt);
        if (Date.now() - focusLostAt >= INTEGRITY_TIMING.WINDOW_BLUR_MS) {
          disqualify("window-blur");
          return;
        }
      }

      if (!splitActive && !sidebarActive && !devtoolsActive) {
        if (recoveryAt === null) recoveryAt = Date.now();
        if (Date.now() - recoveryAt >= INTEGRITY_TIMING.RECOVERY_HOLD_MS) {
          clearSplitWatch();
          clearSidebarWatch();
          if (!focusLost) clearFocusWatch();
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

    // Re-assert the arena lock periodically so any new arena tab steals it
    // and triggers the storage handler in the original tab.
    lockTimer = window.setInterval(() => {
      try {
        const current = window.localStorage.getItem(ARENA_LOCK_KEY);
        if (current && current !== lockId) {
          disqualify("new-window");
        } else {
          window.localStorage.setItem(ARENA_LOCK_KEY, lockId);
        }
      } catch {
        // ignore
      }
    }, 2_500);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocusIn, true);
    window.addEventListener("blur", handleFocusOut, true);
    document.addEventListener("contextmenu", handleContextMenu, true);
    document.addEventListener("beforeinput", handleBeforeInput, true);
    document.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("storage", handleStorage);
    window.visualViewport?.addEventListener("resize", pollIntegrity);
    window.visualViewport?.addEventListener("scroll", pollIntegrity);
    window.addEventListener("resize", pollIntegrity);

    return () => {
      if (settleTimer !== null) window.clearTimeout(settleTimer);
      if (pollTimer !== null) window.clearInterval(pollTimer);
      if (lockTimer !== null) window.clearInterval(lockTimer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocusIn, true);
      window.removeEventListener("blur", handleFocusOut, true);
      document.removeEventListener("contextmenu", handleContextMenu, true);
      document.removeEventListener("beforeinput", handleBeforeInput, true);
      document.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("storage", handleStorage);
      window.visualViewport?.removeEventListener("resize", pollIntegrity);
      window.visualViewport?.removeEventListener("scroll", pollIntegrity);
      window.removeEventListener("resize", pollIntegrity);
      try {
        if (window.localStorage.getItem(ARENA_LOCK_KEY) === lockId) {
          window.localStorage.removeItem(ARENA_LOCK_KEY);
        }
      } catch {
        // ignore
      }
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
