"use client";

import { motion, AnimatePresence } from "framer-motion";

export function LoadingScreen({ show = true }: { show?: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[9999] bg-cosmos flex flex-col items-center justify-center gap-10"
        >
          {/* Bountixx Pixel-Art Ghost Animation */}
          <div id="ghost">
            <div id="red">
              <div id="top0" />
              <div id="top1" />
              <div id="top2" />
              <div id="top3" />
              <div id="top4" />
              
              <div id="st0" />
              <div id="st1" />
              <div id="st2" />
              <div id="st3" />
              <div id="st4" />
              <div id="st5" />
              
              <div id="an1" />
              <div id="an2" />
              <div id="an3" />
              <div id="an4" />
              <div id="an5" />
              <div id="an6" />
              <div id="an7" />
              <div id="an8" />
              <div id="an9" />
              <div id="an10" />
              <div id="an11" />
              <div id="an12" />
              <div id="an13" />
              <div id="an14" />
              <div id="an15" />
              <div id="an16" />
              <div id="an17" />
              <div id="an18" />
              
              <div id="eye" />
              <div id="eye1" />
              <div id="pupil" />
              <div id="pupil1" />
            </div>
            <div id="shadow" />
          </div>

          {/* Loading text with animated dots */}
          <p className="font-space-mono text-xs text-void tracking-[6px] uppercase mt-4">
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
          className="inline-block w-1 h-1 rounded-full bg-void"
          animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }}
        />
      ))}
    </span>
  );
}
