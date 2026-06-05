"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function FinalCTA() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-8% 0px" });

  return (
    <section
      ref={ref}
      className="py-40 px-6 lg:px-14 bg-cosmos-2 border-t border-cosmos-4 scanline-fx text-center"
    >
      <div className="max-w-3xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="font-orbitron font-black text-5xl lg:text-7xl text-haze mb-8"
        >
          READY TO ENTER THE{" "}
          <span style={{ color: "var(--ignite)" }}>ARENA?</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="font-rajdhani text-xl md:text-2xl text-haze-2 mb-14"
        >
          Your first 10 rooms are free. No subscription. Just pure competition.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="flex flex-col items-center gap-4"
        >
          <Link href="/signup">
            <Button variant="primary" size="lg" magnetic className="text-xl px-14 h-16">
              CREATE YOUR FIRST ARENA
            </Button>
          </Link>
          <Link href="/login">
            <p className="font-rajdhani text-sm text-void hover:underline cursor-pointer">
              Already competing? Sign in →
            </p>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
