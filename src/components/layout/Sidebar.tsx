"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Zap, Home, Trophy, User, Wallet, Settings, Circle,
} from "lucide-react";
import { BountixxLogo, BountixxWordmark } from "@/components/BountixxLogo";
import { XPBar } from "@/components/ui/XPBar";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/create",    icon: Zap,      label: "Create Arena" },
  { href: "/dashboard", icon: Home,     label: "Dashboard" },
  { href: "/profile/me", icon: User,    label: "Profile" },
  { href: "/wallet",    icon: Wallet,   label: "Wallet" },
  { href: "#",          icon: Trophy,   label: "Leaderboard", phase2: true },
  { href: "#",          icon: Settings, label: "Settings",   bottom: true },
];

const MOCK_USER = {
  username: "arena_player",
  rank: "CHALLENGER",
  xp: 820,
  xpMax: 2000,
  coins: 450,
  initials: "AP",
};

export function Sidebar() {
  const pathname = usePathname();
  const topItems = navItems.filter((n) => !n.bottom);
  const bottomItems = navItems.filter((n) => n.bottom);

  return (
    <aside
      className="hidden lg:flex flex-col w-[240px] shrink-0 fixed top-0 left-0 h-screen bg-cosmos-2 border-r border-cosmos-4 z-40"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-cosmos-4">
        <BountixxLogo size={36} />
        <BountixxWordmark size={16} />
      </div>

      {/* User identity card */}
      <div className="px-4 py-4 border-b border-cosmos-4">
        {/* Avatar + name */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-full bg-cosmos-3 border border-void/30 flex items-center justify-center shrink-0">
            <span className="font-orbitron font-bold text-sm text-void">
              {MOCK_USER.initials}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-rajdhani font-bold text-sm text-haze truncate">
              @{MOCK_USER.username}
            </p>
            <p className="font-space-mono text-[10px] text-haze-3 tracking-wider">
              {MOCK_USER.rank}
            </p>
          </div>
        </div>
        {/* XP bar */}
        <XPBar
          current={MOCK_USER.xp}
          max={MOCK_USER.xpMax}
          label={`${MOCK_USER.xp.toLocaleString()} / ${MOCK_USER.xpMax.toLocaleString()} XP`}
        />
        {/* Coin balance */}
        <div className="flex items-center gap-2 mt-3">
          <CoinIcon size={14} />
          <span className="font-orbitron font-bold text-base text-crown">
            {MOCK_USER.coins.toLocaleString()}
          </span>
          <span className="font-space-mono text-[9px] text-haze-3 tracking-widest ml-auto">
            COINS
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
        {topItems.map((item) => (
          <NavItem key={item.href} item={item} active={pathname === item.href} />
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="px-3 py-4 border-t border-cosmos-4 flex flex-col gap-1">
        {bottomItems.map((item) => (
          <NavItem key={item.href} item={item} active={pathname === item.href} />
        ))}
        {/* Online indicator */}
        <div className="flex items-center gap-2 px-3 py-2 mt-1">
          <Circle size={8} className="text-success fill-success dot-live" />
          <span className="font-space-mono text-[10px] text-success tracking-widest">
            ONLINE
          </span>
        </div>
      </div>
    </aside>
  );
}

function NavItem({
  item,
  active,
}: {
  item: (typeof navItems)[0];
  active: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "cursor-target flex items-center gap-3 h-11 px-3 transition-all duration-150",
        active
          ? "bg-void/10 border-l-2 border-void text-void"
          : "text-haze-2 hover:text-haze hover:bg-cosmos-3 border-l-2 border-transparent",
        item.phase2 && "opacity-40 pointer-events-none"
      )}
    >
      <Icon
        size={18}
        className={cn(
          active ? "text-void" : "text-haze-3",
          "transition-colors duration-150"
        )}
        aria-hidden="true"
      />
      <span className="font-rajdhani font-semibold text-sm tracking-wide">
        {item.label}
      </span>
      {item.phase2 && (
        <span className="ml-auto font-space-mono text-[8px] text-haze-3 border border-haze-3/30 px-1">
          SOON
        </span>
      )}
    </Link>
  );
}

function CoinIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="7" stroke="#F0A500" strokeWidth="1.5" />
      <circle cx="8" cy="8" r="4.5" stroke="#F0A500" strokeWidth="1" strokeOpacity="0.5" />
      <text x="8" y="11.5" textAnchor="middle" fill="#F0A500" fontSize="7" fontWeight="bold" fontFamily="monospace">B</text>
    </svg>
  );
}
