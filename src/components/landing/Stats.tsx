"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { staggerContainer, slideUp } from "@/lib/animations";

const stats = [
  { value: 14823, label: "ARENAS PLAYED",      prefix: "",  suffix: "" },
  { value: 2341,  label: "PLAYERS ONLINE NOW", prefix: "",  suffix: "" },
  { value: 0,     label: "SUBSCRIPTION FEE",   prefix: "",  suffix: "", special: "FREE" },
  { value: 41,    label: "COUNTRIES COMPETING", prefix: "", suffix: "" },
];

export function Stats() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-8% 0px" });

  return (
    <section className="py-36 px-6 lg:px-14" ref={ref}>
      <div className="max-w-[1400px] mx-auto">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          className="grid grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={slideUp}
              className="bg-cosmos-2 border border-cosmos-4 p-6 clip-arena"
            >
              {stat.special ? (
                <p className="font-orbitron font-black text-5xl text-ignite mb-2">
                  {stat.special}
                </p>
              ) : (
                <AnimatedNumber
                  value={stat.value}
                  className="font-orbitron font-black text-5xl text-ignite block mb-2"
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                />
              )}
              <p className="font-share-mono text-[10px] text-haze-2 tracking-[3px] uppercase">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
