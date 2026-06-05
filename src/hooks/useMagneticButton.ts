"use client";

import { useRef, useCallback } from "react";

export function useMagneticButton(strength = 0.3) {
  const ref = useRef<HTMLElement | null>(null);

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) * strength;
      const dy = (e.clientY - cy) * strength;
      ref.current.style.transform = `translate(${dx}px, ${dy}px)`;
      ref.current.style.transition = "transform 0.15s ease-out";
    },
    [strength]
  );

  const onMouseLeave = useCallback(() => {
    if (!ref.current) return;
    ref.current.style.transform = "translate(0,0)";
    ref.current.style.transition = "transform 0.5s cubic-bezier(0.16,1,0.3,1)";
  }, []);

  return { ref, onMouseMove, onMouseLeave };
}
