"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { BountixxLogo } from "@/components/BountixxLogo";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
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
          background: scrolled ? "var(--surface-raised)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid var(--border-1)" : "1px solid transparent",
        }}
      >
        <div className={`${LANDING_GUTTERS} relative h-18 min-h-[4.5rem] flex items-center justify-between gap-6`}>
          <Link href="/" aria-label="Bountixx home" className="cursor-target shrink-0">
            <BountixxLogo size={36} showWordmark />
          </Link>

          <div className="hidden md:flex items-center gap-8 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            {NAV.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="cursor-target group relative py-2 text-sm font-medium text-haze-2 hover:text-haze transition-colors"
              >
                {label}
                <span
                  className="absolute left-0 right-0 bottom-0 h-px scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 bg-plum"
                  aria-hidden
                />
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto">
            <ThemeToggle />

            <Link href="/login" className="hidden sm:block">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/signup">
              <Button variant="primary" size="sm" magnetic>
                Get started
              </Button>
            </Link>

            <button
              type="button"
              className="md:hidden text-haze-2 hover:text-haze transition-colors p-2 rounded-lg hover:bg-[var(--surface-hover)]"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-[var(--border-1)]"
              style={{ background: "var(--surface-raised)", backdropFilter: "blur(20px)" }}
            >
              {NAV.map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="block px-6 py-4 text-sm font-medium text-haze-2 hover:text-haze hover:bg-[var(--surface-hover)] border-b border-[var(--border-1)] transition-colors"
                >
                  {label}
                </a>
              ))}
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="block px-6 py-4 text-sm font-medium text-plum hover:bg-[var(--surface-hover)] transition-colors"
              >
                Sign in
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
}
