"use client";

import { usePresenceHeartbeat } from "@/hooks/usePresenceHeartbeat";
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
  usePresenceHeartbeat();

  return (
    <div className="flex min-h-[100dvh] flex-col bg-cosmos">
      <TopNav />
      <main className="flex flex-1 flex-col w-full min-h-0 pb-20 md:pb-0">
        {children}
      </main>
      <MobileBottomNav />
    </div>
  );
}
