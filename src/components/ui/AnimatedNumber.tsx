"use client";

import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring, animate } from "framer-motion";
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
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { duration: duration * 1000, bounce: 0 });
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });

  useEffect(() => {
    if (inView) {
      animate(motionVal, value, {
        duration,
        ease: [0.16, 1, 0.3, 1],
      });
    }
  }, [inView, motionVal, value, duration]);

  useEffect(() => {
    return spring.on("change", (latest) => {
      if (ref.current) {
        const display = format ? formatCoins(Math.round(latest)) : String(Math.round(latest));
        ref.current.textContent = `${prefix}${display}${suffix}`;
      }
    });
  }, [spring, prefix, suffix, format]);

  return (
    <span ref={ref} className={className} style={style}>
      {prefix}0{suffix}
    </span>
  );
}
