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
    <div className="flex flex-col min-h-screen bg-cosmos">
      <TopNav />
      <main className="flex-1 w-full pt-[76px] pb-20 md:pb-12">
        {children}
      </main>
      <MobileBottomNav />
    </div>
  );
}
