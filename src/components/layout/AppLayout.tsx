"use client";

import { TopNav, MobileBottomNav } from "./TopNav";

interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * App shell: fixed top nav + scrollable content area.
 * pt-16 offsets for the 64px fixed top nav height.
 * pb-20 on mobile leaves room for the bottom tab bar.
 */
export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-cosmos">
      <TopNav />
      <main className="pt-[68px] pb-20 md:pb-12 min-h-screen">
        {children}
      </main>
      <MobileBottomNav />
    </div>
  );
}
