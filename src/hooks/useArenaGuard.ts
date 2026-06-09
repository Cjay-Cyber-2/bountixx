"use client";

import { useEffect, useRef } from "react";

interface ArenaGuardOptions {
  onStrike: (count: number, reason: string) => void;
  onDisqualify?: () => void;
  maxStrikes?: number;
}

export function useArenaGuard({
  onStrike,
  onDisqualify,
  maxStrikes = 1,
}: ArenaGuardOptions) {
  const strikeCount = useRef(0);

  useEffect(() => {
    function addStrike(reason: string) {
      strikeCount.current += 1;
      onStrike(strikeCount.current, reason);
      if (strikeCount.current >= maxStrikes) {
        onDisqualify?.();
      }
    }

    // Only visibilitychange — blur also fires on every tab switch, causing double-strikes
    function handleVisibilityChange() {
      if (document.hidden) addStrike("tab-switch");
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [onStrike, onDisqualify, maxStrikes]);

  function blockPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    if (target && "value" in target) target.value = "";
  }

  return { blockPaste, strikes: strikeCount };
}
