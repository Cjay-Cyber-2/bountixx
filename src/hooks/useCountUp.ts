"use client";

import { useEffect, useRef, useState } from "react";
import { easeOutExpo } from "@/lib/utils";

export function useCountUp(
  target: number,
  duration = 1500,
  startOnMount = true
) {
  const [value, setValue] = useState(0);
  const [started, setStarted] = useState(startOnMount);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!started) return;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutExpo(progress);
      setValue(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, started]);

  return { value, start: () => setStarted(true) };
}
