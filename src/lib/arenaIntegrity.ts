export type ArenaCheatReason = "tab-switch" | "split-view" | "side-panel" | "external-input";

export type ViewSnapshot = {
  innerWidth: number;
  innerHeight: number;
  outerWidth: number;
  outerHeight: number;
  screenWidth: number;
  screenHeight: number;
};

export type IntegrityProfile = {
  snapshot: ViewSnapshot;
  keyboardOpen: boolean;
  splitTabLayout: boolean;
  fullWindowSplitLayout: boolean;
  dynamicSidebarLoss: number;
  focusLost: boolean;
  hidden: boolean;
};

export const INTEGRITY_TIMING = {
  ENTRY_GRACE_MS: 4_000,
  BASELINE_SETTLE_MS: 1_200,
  POLL_MS: 350,
  SPLIT_VIEW_MS: 5_500,
  SPLIT_VIEW_WITH_FOCUS_MS: 2_200,
  SIDE_PANEL_MS: 2_400,
  SIDE_PANEL_WIDTH_ONLY_MS: 4_500,
  SIDE_PANEL_MIN_LOSS: 100,
  SPLIT_MIN_GUTTER: 72,
  SPLIT_TAB_RATIO: 0.62,
  SPLIT_RECOVERY_RATIO: 0.7,
  RECOVERY_HOLD_MS: 900,
  WARNING_LEAD_MS: 2_000,
} as const;

export function readViewSnapshot(): ViewSnapshot {
  const vv = window.visualViewport;
  return {
    innerWidth: vv?.width ?? window.innerWidth,
    innerHeight: vv?.height ?? window.innerHeight,
    outerWidth: window.outerWidth,
    outerHeight: window.outerHeight,
    screenWidth: window.screen.availWidth,
    screenHeight: window.screen.availHeight,
  };
}

export function isMobileIntegrityLayout(snapshot: ViewSnapshot): boolean {
  if (snapshot.screenWidth < 768) return true;
  const chromeGutter = Math.max(0, snapshot.outerWidth - snapshot.innerWidth);
  return chromeGutter < 48 && snapshot.screenWidth < 1024;
}

export function isKeyboardOpen(snapshot: ViewSnapshot, baseline: ViewSnapshot): boolean {
  return (
    snapshot.innerHeight < baseline.innerHeight * 0.72 &&
    snapshot.innerWidth > baseline.innerWidth * 0.88
  );
}

/** Chrome side-by-side tabs: outerWidth stays wide while innerWidth is ~half. */
export function isSplitTabLayout(snapshot: ViewSnapshot): boolean {
  if (snapshot.outerWidth < 520) return false;
  const gutter = snapshot.outerWidth - snapshot.innerWidth;
  const ratio = snapshot.innerWidth / snapshot.outerWidth;
  return ratio <= INTEGRITY_TIMING.SPLIT_TAB_RATIO && gutter >= INTEGRITY_TIMING.SPLIT_MIN_GUTTER;
}

/**
 * Full-screen browser window with a narrow content column — typical of split view
 * configured before the arena page loads (self-baseline would miss this).
 */
export function isFullWindowSplitLayout(snapshot: ViewSnapshot): boolean {
  if (isMobileIntegrityLayout(snapshot)) return false;
  if (snapshot.screenWidth < 900) return false;

  const windowNearFull = snapshot.outerWidth >= snapshot.screenWidth * 0.82;
  const contentTooNarrow = snapshot.innerWidth <= snapshot.screenWidth * 0.56;
  const gutter = snapshot.outerWidth - snapshot.innerWidth;

  return windowNearFull && contentTooNarrow && gutter >= INTEGRITY_TIMING.SPLIT_MIN_GUTTER;
}

export function isSplitViewLayout(snapshot: ViewSnapshot): boolean {
  return isSplitTabLayout(snapshot) || isFullWindowSplitLayout(snapshot);
}

export function dynamicSidebarLoss(snapshot: ViewSnapshot, baseline: ViewSnapshot): number {
  return Math.max(0, baseline.innerWidth - snapshot.innerWidth);
}

export function isDynamicSidebar(snapshot: ViewSnapshot, baseline: ViewSnapshot): boolean {
  const loss = dynamicSidebarLoss(snapshot, baseline);
  const heightStable = snapshot.innerHeight >= baseline.innerHeight * 0.78;
  return loss >= INTEGRITY_TIMING.SIDE_PANEL_MIN_LOSS && heightStable;
}

export function buildIntegrityProfile(
  baseline: ViewSnapshot,
  opts?: { focusLost?: boolean; hidden?: boolean },
): IntegrityProfile {
  const snapshot = readViewSnapshot();
  const keyboardOpen = isKeyboardOpen(snapshot, baseline);

  return {
    snapshot,
    keyboardOpen,
    splitTabLayout: !keyboardOpen && isSplitViewLayout(snapshot),
    fullWindowSplitLayout: !keyboardOpen && isFullWindowSplitLayout(snapshot),
    dynamicSidebarLoss: dynamicSidebarLoss(snapshot, baseline),
    focusLost: Boolean(opts?.focusLost),
    hidden: Boolean(opts?.hidden),
  };
}

export function arenaCheatMessage(reason: ArenaCheatReason): string {
  switch (reason) {
    case "tab-switch":
      return "You left the arena tab. Stay on this page for the whole round.";
    case "split-view":
      return "Split view was detected. Use one full-width arena tab — side-by-side AI panels aren't allowed.";
    case "side-panel":
      return "An external side panel or assistant was detected. Close it and use only the arena page.";
    case "external-input":
      return "Pasting or external text insertion isn't allowed during live arenas.";
  }
}

export function arenaWarningMessage(kind: "split-view" | "side-panel"): string {
  if (kind === "split-view") {
    return "Split view detected — switch to a full-width tab or you'll be removed.";
  }
  return "External panel detected — close side tools and stay focused on the arena.";
}

export function isBlockedBeforeInput(inputType: string): boolean {
  return (
    inputType === "insertFromPaste" ||
    inputType === "insertFromDrop" ||
    inputType === "insertFromYank" ||
    inputType === "insertReplacementText" ||
    inputType === "insertFromPasteAsQuotation"
  );
}
