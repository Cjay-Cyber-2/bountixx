"use client";

import { TopNav, MobileBottomNav } from "./TopNav";

interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * App shell: a sticky top nav inside a flex column. Because the nav is sticky
 * (in normal flow) rather than fixed, page content can never be hidden behind
 * it. pb-24 on mobile leaves room for the bottom tab bar.
 */
export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-cosmos">
      <TopNav />
      <main className="flex-1 w-full pb-24 md:pb-12">
        {children}
      </main>
      <MobileBottomNav />
    </div>
  );
}
