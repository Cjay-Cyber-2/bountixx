"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, PlusCircle, User, Wallet, Menu, X, Bell, LogOut } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/components/providers/AuthProvider";
import { BountixxLogo } from "@/components/BountixxLogo";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard",  label: "Dashboard",   icon: LayoutDashboard },
  { href: "/create",     label: "Create Arena", icon: PlusCircle     },
  { href: "/profile/me", label: "Profile",      icon: User           },
  { href: "/wallet",     label: "Wallet",       icon: Wallet         },
];

type UserProfile = {
  username: string;
  avatarUrl: string | null;
  coinsBalance: number;
  rank: string;
};

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetch("/api/user/me")
      .then((r) => r.json())
      .then((d) => d.user && setProfile(d.user))
      .catch(() => {});
  }, [user]);

  async function handleLogout() {
    setSigningOut(true);
    try {
      await signOut(auth);
      await fetch("/api/auth/session", { method: "DELETE" });
      router.replace("/");
    } catch {
      setSigningOut(false);
    }
  }

  const initials = profile?.username
    ? profile.username.slice(0, 2).toUpperCase()
    : user?.displayName
    ? user.displayName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  return (
    <>
      <header
        className="fixed top-0 inset-x-0 z-50 h-16 border-b border-cosmos-4"
        style={{ background: "rgba(14,8,24,0.92)", backdropFilter: "blur(16px)" }}
      >
        <div className="max-w-[1400px] mx-auto h-full px-5 flex items-center justify-between gap-6">

          {/* Logo */}
          <Link href="/dashboard" className="shrink-0 cursor-target">
            <BountixxLogo size={36} showWordmark />
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-2">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "cursor-target relative flex items-center gap-2 px-4 py-2 font-rajdhani font-semibold text-sm transition-colors",
                    active ? "text-haze" : "text-haze-2 hover:text-haze"
                  )}
                >
                  <Icon size={15} aria-hidden />
                  {label}
                  {active && (
                    <motion.span
                      layoutId="topnav-pill"
                      className="absolute inset-0 bg-cosmos-3 border border-cosmos-4 -z-10"
                      style={{ borderRadius: 4 }}
                      transition={{ type: "spring", stiffness: 380, damping: 38 }}
                    />
                  )}
                  {active && (
                    <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-void" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right cluster */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            {/* Coin balance */}
            <div className="flex items-center gap-1.5 bg-cosmos-2 border border-cosmos-4 px-3 py-1.5">
              <span className="text-crown text-xs" aria-hidden>◈</span>
              <span className="font-orbitron font-bold text-sm text-crown">
                {profile?.coinsBalance ?? 0}
              </span>
            </div>

            {/* Notifications */}
            <button
              className="cursor-target relative text-haze-2 hover:text-haze transition-colors p-1"
              aria-label="Notifications"
            >
              <Bell size={18} />
              <span
                className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-void border border-cosmos"
                aria-hidden
              />
            </button>

            {/* Avatar */}
            <Link href="/profile/me" className="cursor-target">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.username}
                  className="w-8 h-8 rounded-full border-2 border-void/60 hover:border-void transition-colors object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full border-2 border-void/60 bg-cosmos-3 flex items-center justify-center hover:border-void transition-colors">
                  <span className="font-orbitron font-bold text-[10px] text-haze">{initials}</span>
                </div>
              )}
            </Link>

            {/* Logout */}
            <button
              onClick={handleLogout}
              disabled={signingOut}
              className="cursor-target text-haze-3 hover:text-danger transition-colors p-1 disabled:opacity-40"
              aria-label="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-haze-2 hover:text-haze transition-colors p-1"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed top-16 inset-x-0 z-40 border-b border-cosmos-4 pb-2"
            style={{ background: "rgba(14,8,24,0.97)", backdropFilter: "blur(20px)" }}
          >
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-6 py-4 font-rajdhani font-semibold text-base border-b border-cosmos-4/40 transition-colors",
                    active
                      ? "text-void bg-void/5"
                      : "text-haze-2 hover:text-haze hover:bg-cosmos-2"
                  )}
                >
                  <Icon size={18} aria-hidden />
                  {label}
                </Link>
              );
            })}
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-1.5 bg-cosmos-2 border border-cosmos-4 px-3 py-1.5">
                <span className="text-crown text-xs">◈</span>
                <span className="font-orbitron font-bold text-sm text-crown">
                  {profile?.coinsBalance ?? 0}
                </span>
              </div>
              <span className="font-space-mono text-[10px] text-haze-3 uppercase tracking-widest">
                {profile?.rank ?? "RECRUIT"}
              </span>
              <button
                onClick={handleLogout}
                disabled={signingOut}
                className="flex items-center gap-2 font-space-mono text-[11px] text-danger border border-danger/30 px-3 py-1.5 hover:bg-danger/10 transition-colors disabled:opacity-40"
              >
                <LogOut size={13} />
                SIGN OUT
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/** Bottom tab bar — mobile only */
export function MobileBottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-cosmos-4 flex"
      style={{ background: "rgba(14,8,24,0.97)", backdropFilter: "blur(20px)" }}
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 py-3 transition-colors",
              active ? "text-void" : "text-haze-3 hover:text-haze-2"
            )}
          >
            <Icon size={20} aria-hidden />
            <span className="font-rajdhani text-[9px] font-semibold tracking-widest uppercase">
              {label.split(" ")[0]}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
