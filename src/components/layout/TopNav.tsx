"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, PlusCircle, User, Wallet, Menu, X, Bell, BellOff, LogOut } from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import { useAuth } from "@/components/providers/AuthProvider";
import { BountixxLogo } from "@/components/BountixxLogo";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { firebaseEnabled } from "@/lib/firebase";
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
  const { signOut } = useClerk();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);

  useEffect(() => {
    // Clear any previous user's profile immediately so a different account
    // never briefly shows the prior user's name/initials.
    setProfile(null);
    if (!user) return;
    let cancelled = false;
    fetchWithAuth("/api/user/me")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.user) setProfile(d.user);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function handleNotificationOptIn() {
    if (notifEnabled || notifLoading) return;
    if (!firebaseEnabled) return; // Push notifications not configured.
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;

    setNotifLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;

      // Dynamically import to avoid SSR module evaluation
      const { getMessaging, register, onRegistered } = await import("firebase/messaging");
      const { app } = await import("@/lib/firebase");
      if (!app) return;
      const messaging = getMessaging(app);

      const swReg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

      // Subscribe via the FID-based new API
      await register(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FCM_VAPID_KEY,
        serviceWorkerRegistration: swReg,
      });

      onRegistered(messaging, async (fid: string) => {
        if (!fid) return;
        await fetchWithAuth("/api/notifications/subscribe", {
          method: "POST",
          body: JSON.stringify({ token: fid }),
        });
        setNotifEnabled(true);
      });
    } catch (err) {
      console.error("[FCM] opt-in failed:", err);
    } finally {
      setNotifLoading(false);
    }
  }

  async function handleLogout() {
    setSigningOut(true);
    try {
      setProfile(null);
      await signOut({ redirectUrl: "/" });
    } catch {
      setSigningOut(false);
      router.replace("/");
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
        style={{ background: "var(--surface-raised)", backdropFilter: "blur(16px)" }}
      >
        <div className="max-w-[1400px] mx-auto h-full px-5 grid grid-cols-[1fr_auto_1fr] items-center">

          {/* Left: Logo */}
          <div className="flex items-center">
            <Link href="/dashboard" className="shrink-0 cursor-target">
              <BountixxLogo size={36} showWordmark />
            </Link>
          </div>

          {/* Centre: Desktop nav links — always truly centred */}
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

          {/* Right: desktop right cluster + mobile hamburger */}
          <div className="flex items-center justify-end gap-3">
            {/* Desktop-only cluster */}
            <div className="hidden md:flex items-center gap-3 shrink-0">
              {/* Coin balance */}
              <div className="flex items-center gap-1.5 bg-cosmos-2 border border-cosmos-4 px-3 py-1.5">
                <span className="text-crown text-xs" aria-hidden>◈</span>
                <span className="font-orbitron font-bold text-sm text-crown">
                  {profile?.coinsBalance ?? 0}
                </span>
              </div>

              {/* Notifications opt-in */}
              <button
                onClick={handleNotificationOptIn}
                disabled={notifLoading}
                className={cn(
                  "cursor-target relative transition-colors p-1 disabled:opacity-40",
                  notifEnabled ? "text-success" : "text-haze-2 hover:text-haze"
                )}
                aria-label={notifEnabled ? "Notifications enabled" : "Enable notifications"}
                title={notifEnabled ? "Notifications enabled" : "Enable push notifications"}
              >
                {notifEnabled ? <Bell size={18} /> : <BellOff size={18} />}
                {!notifEnabled && (
                  <span
                    className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-void border border-cosmos"
                    aria-hidden
                  />
                )}
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
                className="cursor-target flex items-center gap-1.5 font-space-mono text-[10px] tracking-widest text-haze-2 hover:text-danger border border-cosmos-4 hover:border-danger/50 px-2.5 py-1.5 transition-all disabled:opacity-40 whitespace-nowrap"
                aria-label="Sign out"
              >
                <LogOut size={12} aria-hidden />
                {signingOut ? "…" : "SIGN OUT"}
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
            style={{ background: "var(--surface-raised)", backdropFilter: "blur(20px)" }}
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
      style={{ background: "var(--surface-raised)", backdropFilter: "blur(20px)" }}
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
