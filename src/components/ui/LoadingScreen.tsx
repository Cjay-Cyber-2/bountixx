"use client";

import { motion, AnimatePresence } from "framer-motion";
import { BountixxLogo } from "@/components/BountixxLogo";

export function LoadingScreen({ show = true }: { show?: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[9999] bg-cosmos flex flex-col items-center justify-center gap-6"
        >
          {/* Logo with pulsing rings */}
          <div className="relative flex items-center justify-center">
            <span
              className="absolute inset-0 border border-ignite/30 rounded-full pulse-ring"
              style={{ width: 120, height: 120, top: -20, left: -20 }}
            />
            <span
              className="absolute inset-0 border border-ignite/20 rounded-full pulse-ring-delay"
              style={{ width: 120, height: 120, top: -20, left: -20 }}
            />
            <BountixxLogo size={64} />
          </div>

          {/* Loading text with animated dots */}
          <p className="font-share-mono text-xs text-ignite tracking-[6px] uppercase">
            LOADING ARENA
            <LoadingDots />
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function LoadingDots() {
  return (
    <span className="inline-flex gap-0.5 ml-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block w-1 h-1 rounded-full bg-ignite"
          animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }}
        />
      ))}
    </span>
  );
}
