"use client";

import { useEffect, useRef } from "react";
import { useMotionValue, useSpring, animate } from "framer-motion";
import { formatCoins } from "@/lib/utils";

interface AnimatedNumberProps {
  value: number;
  className?: string;
  style?: React.CSSProperties;
  prefix?: string;
  suffix?: string;
  format?: boolean;
  duration?: number;
}

export function AnimatedNumber({
  value,
  className,
  style,
  prefix = "",
  suffix = "",
  format = true,
  duration = 1.5,
}: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionVal = useMotionValue(value);
  const spring = useSpring(motionVal, { duration: duration * 1000, bounce: 0 });

  useEffect(() => {
    animate(motionVal, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
    });
  }, [motionVal, value, duration]);

  useEffect(() => {
    return spring.on("change", (latest) => {
      if (ref.current) {
        const display = format ? formatCoins(Math.round(latest)) : String(Math.round(latest));
        ref.current.textContent = `${prefix}${display}${suffix}`;
      }
    });
  }, [spring, prefix, suffix, format]);

  useEffect(() => {
    if (ref.current) {
      const display = format ? formatCoins(Math.round(value)) : String(Math.round(value));
      ref.current.textContent = `${prefix}${display}${suffix}`;
    }
  }, [value, prefix, suffix, format]);

  return (
    <span ref={ref} className={className} style={style}>
      {prefix}{format ? formatCoins(value) : String(value)}{suffix}
    </span>
  );
}
