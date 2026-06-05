"use client";

import { useEffect, useState } from "react";

export function useTypewriter(
  lines: string[],
  msPerChar = 40,
  msPerLine = 350
) {
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let lineIdx = 0;
    let charIdx = 0;

    async function run() {
      for (lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        const line = lines[lineIdx];
        for (charIdx = 0; charIdx <= line.length; charIdx++) {
          if (cancelled) return;
          setDisplayedLines((prev) => {
            const next = [...prev];
            next[lineIdx] = line.slice(0, charIdx);
            return next;
          });
          await sleep(msPerChar);
        }
        await sleep(msPerLine);
      }
      if (!cancelled) setDone(true);
    }

    run();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { displayedLines, done };
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}
