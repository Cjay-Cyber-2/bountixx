"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BountixxLogo } from "@/components/BountixxLogo";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const NAV = [
  { href: "#how-it-works", label: "How It Works" },
  { href: "#categories",   label: "Categories" },
  { href: "#ranks",        label: "Ranks" },
];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(14,8,24,0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled
            ? "1px solid rgba(45,27,105,0.4)"
            : "1px solid transparent",
        }}
      >
        <div className="max-w-[1280px] mx-auto h-20 px-6 lg:px-14 flex items-center justify-between gap-12">
          {/* Logo */}
          <Link href="/" aria-label="Bountixx home" className="cursor-target">
            <BountixxLogo size={36} showWordmark />
          </Link>

          {/* Center nav links with wide spacing */}
          <div className="hidden md:flex items-center gap-10">
            {NAV.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="cursor-target group relative py-2 font-space-mono text-[11px] tracking-[3px] uppercase text-haze-2 hover:text-haze transition-colors"
              >
                {label}
                <span
                  className="absolute left-0 right-0 bottom-0 h-px scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300"
                  style={{ background: "#9B6BFF" }}
                  aria-hidden
                />
              </a>
            ))}
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/login" className="hidden sm:block">
              <Button
                variant="ghost"
                size="sm"
                className="font-space-mono text-[11px] tracking-[2px] text-haze-2 hover:text-haze"
              >
                SIGN IN
              </Button>
            </Link>
            <Link href="/signup">
              <Button
                variant="primary"
                size="sm"
                magnetic
                className="font-space-mono text-[11px] tracking-[2px] h-10 px-5"
                style={{
                  background: "#FF6B1A",
                  borderColor: "#FF6B1A",
                  boxShadow: "0 0 24px rgba(255,107,26,0.3)",
                } as React.CSSProperties}
              >
                GET STARTED
              </Button>
            </Link>
          </div>
        </div>
      </motion.nav>
    </>
  );
}
