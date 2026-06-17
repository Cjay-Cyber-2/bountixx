"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { BountixxLogo } from "@/components/BountixxLogo";
import { Button } from "@/components/ui/Button";
import { LANDING_GUTTERS } from "@/components/landing/_section";

const NAV = [
  { href: "#how-it-works", label: "How It Works" },
  { href: "#categories",   label: "Categories" },
  { href: "#ranks",        label: "Ranks" },
];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

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
        <div className={`${LANDING_GUTTERS} relative h-20 flex items-center justify-between gap-6`}>
          {/* Logo */}
          <Link href="/" aria-label="Bountixx home" className="cursor-target shrink-0">
            <BountixxLogo size={36} showWordmark />
          </Link>

          {/* Center nav links — viewport-centered */}
          <div className="hidden md:flex items-center gap-10 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
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
          <div className="flex items-center gap-3 sm:gap-4 shrink-0 ml-auto">
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
                className="font-space-mono text-[11px] tracking-[2px] h-10 px-4 sm:px-5"
                style={{
                  background: "#FF6B1A",
                  borderColor: "#FF6B1A",
                  boxShadow: "0 0 24px rgba(255,107,26,0.3)",
                } as React.CSSProperties}
              >
                GET STARTED
              </Button>
            </Link>

            {/* Mobile menu toggle */}
            <button
              type="button"
              className="md:hidden text-haze-2 hover:text-haze transition-colors p-1"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-cosmos-4"
              style={{ background: "rgba(14,8,24,0.96)", backdropFilter: "blur(20px)" }}
            >
              {NAV.map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="block px-6 py-4 font-space-mono text-[12px] tracking-[3px] uppercase text-haze-2 hover:text-haze hover:bg-cosmos-2 border-b border-cosmos-4/40 transition-colors"
                >
                  {label}
                </a>
              ))}
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="block px-6 py-4 font-space-mono text-[12px] tracking-[3px] uppercase text-void hover:bg-cosmos-2 transition-colors"
              >
                Sign In
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
}
