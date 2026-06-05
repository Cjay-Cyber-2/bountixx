"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BountixxLogo } from "@/components/BountixxLogo";
import { Button } from "@/components/ui/Button";

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(14,8,24,0.88)" : "transparent",
        backdropFilter: scrolled ? "blur(18px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(45,27,105,0.5)" : "1px solid transparent",
      }}
    >
      <div className="max-w-[1400px] mx-auto h-16 px-6 lg:px-12 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link href="/" aria-label="Bountixx home" className="cursor-target">
          <BountixxLogo size={36} showWordmark />
        </Link>

        {/* Nav links (desktop) */}
        <div className="hidden md:flex items-center gap-8">
          {[
            ["#how-it-works", "How It Works"],
            ["#categories",   "Categories"],
            ["#ranks",        "Ranks"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="cursor-target font-rajdhani font-semibold text-sm text-haze-2 hover:text-haze transition-colors"
            >
              {label}
            </a>
          ))}
        </div>

        {/* Auth buttons */}
        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden sm:block">
            <Button variant="ghost" size="sm">SIGN IN</Button>
          </Link>
          <Link href="/signup">
            <Button variant="primary" size="sm" magnetic>GET STARTED</Button>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
