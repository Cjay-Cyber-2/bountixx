"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, Home, User, Wallet, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/dashboard", icon: Home,   label: "Home" },
  { href: "/create",    icon: Zap,    label: "Create" },
  { href: "/profile/me", icon: User,  label: "Profile" },
  { href: "/wallet",    icon: Wallet, label: "Wallet" },
  { href: "#",          icon: Trophy, label: "Ranks", phase2: true },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-cosmos-2 border-t border-cosmos-4"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Mobile navigation"
    >
      <div className="flex items-center h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "cursor-target flex-1 flex flex-col items-center justify-center gap-1 h-full transition-colors",
                active ? "text-void" : "text-haze-3 hover:text-haze-2",
                tab.phase2 && "opacity-40 pointer-events-none"
              )}
            >
              <Icon size={20} aria-hidden="true" />
              <span className="font-rajdhani font-semibold text-[10px] tracking-wide">
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
