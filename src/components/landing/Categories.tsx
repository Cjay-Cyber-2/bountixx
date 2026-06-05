"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Code2, HelpCircle, Brain, Calculator, FileText, Palette } from "lucide-react";
import { staggerContainer, slideUp } from "@/lib/animations";

const categories = [
  {
    icon: Code2, label: "Coding", color: "#FF6B1A",
    desc: "Functions, algorithms, data structures",
    phase2: false,
  },
  {
    icon: HelpCircle, label: "Trivia", color: "#F0A500",
    desc: "Knowledge, pop culture, history",
    phase2: false,
  },
  {
    icon: Brain, label: "Logic", color: "#9B6BFF",
    desc: "Puzzles, riddles, lateral thinking",
    phase2: false,
  },
  {
    icon: Calculator, label: "Math", color: "#00D68F",
    desc: "Speed math, equations, proofs",
    phase2: false,
  },
  {
    icon: FileText, label: "Writing", color: "#FF6B9D",
    desc: "Prompts, stories, copy",
    phase2: true,
  },
  {
    icon: Palette, label: "Design", color: "#4ECDC4",
    desc: "Visual challenges",
    phase2: true,
  },
];

export function Categories() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-8% 0px" });

  return (
    <section id="categories" className="py-36 px-6 lg:px-14" ref={ref}>
      <div className="max-w-[1400px] mx-auto">
      <p className="font-share-mono text-xs text-ignite tracking-[6px] mb-4 uppercase">
        Challenge Types
      </p>
      <h2 className="font-orbitron font-bold text-4xl lg:text-5xl text-haze mb-16">
        WHAT CAN YOU CHALLENGE?
      </h2>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate={inView ? "show" : "hidden"}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <motion.div
              key={cat.label}
              variants={slideUp}
              className="relative group bg-cosmos-2 border border-cosmos-4 p-6 cursor-pointer
                         hover:-translate-y-1 hover:border-opacity-100 transition-all duration-200"
              style={{ borderTop: `2px solid ${cat.color}` }}
            >
              {cat.phase2 && (
                <div className="absolute inset-0 bg-cosmos-2/60 flex items-center justify-center z-10">
                  <span className="font-share-mono text-xs text-haze-3 border border-haze-3/40 px-3 py-1 bg-cosmos-2">
                    COMING SOON
                  </span>
                </div>
              )}

              <Icon size={28} className="mb-4" style={{ color: cat.color }} aria-hidden="true" />
              <h3 className="font-rajdhani font-bold text-lg text-haze mb-1 tracking-wide">
                {cat.label}
              </h3>
              <p className="font-rajdhani text-sm text-haze-2">{cat.desc}</p>

              {/* Corner pulse rings on hover */}
              <span
                className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: cat.color }}
                aria-hidden="true"
              />
            </motion.div>
          );
        })}
      </motion.div>
      </div>
    </section>
  );
}
