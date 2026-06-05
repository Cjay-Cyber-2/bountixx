import Link from "next/link";
import { BountixxLogo } from "@/components/BountixxLogo";

const NAV_LINKS = [
  { label: "Home",         href: "/" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Categories",   href: "/#categories" },
  { label: "Ranks",        href: "/#ranks" },
  { label: "Privacy",      href: "#" },
  { label: "Terms",        href: "#" },
];

const SOCIALS = [
  { label: "Twitter",  href: "#", icon: "𝕏" },
  { label: "Discord",  href: "#", icon: "ⅅ" },
  { label: "GitHub",   href: "#", icon: "⌥" },
];

export function Footer() {
  return (
    <footer className="bg-cosmos border-t border-cosmos-4">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-14 py-16">
        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-12 items-start mb-12">

          {/* Brand */}
          <div>
            <BountixxLogo size={44} showWordmark className="mb-5" />
            <p className="font-rajdhani text-sm text-haze-2 max-w-[220px] leading-relaxed">
              The AI-powered multiplayer challenge arena. Drop any challenge. One winner claims the bounty.
            </p>
          </div>

          {/* Nav links */}
          <nav className="flex flex-wrap gap-x-8 gap-y-3 md:justify-center md:pt-3">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="font-rajdhani text-sm text-haze-2 hover:text-haze transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Socials */}
          <div className="flex gap-3 md:pt-3">
            {SOCIALS.map(({ label, href, icon }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="w-9 h-9 flex items-center justify-center border border-cosmos-4 text-haze-3 hover:text-haze hover:border-ignite/50 transition-all font-bold text-sm"
              >
                {icon}
              </a>
            ))}
          </div>
        </div>

        {/* Bottom strip */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-8 border-t border-cosmos-4">
          <p className="font-share-mono text-[10px] text-haze-3 tracking-wider">
            © 2025 Bountixx. All rights reserved.
          </p>
          <p className="font-share-mono text-[10px] text-haze-3 tracking-widest">
            BUILT FOR CHAMPIONS
          </p>
        </div>
      </div>
    </footer>
  );
}
