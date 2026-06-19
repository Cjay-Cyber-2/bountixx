"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, PlusCircle, User, Wallet, Menu, X, Bell, BellOff, LogOut } from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import { useAuth } from "@/components/providers/AuthProvider";
import { BountixxLogo } from "@/components/BountixxLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { firebaseEnabled } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { APP_GUTTERS } from "@/components/landing/_section";

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

type MeResponse = {
  user?: UserProfile;
  coinsUnlimited?: boolean;
};

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { signOut } = useClerk();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [coinsUnlimited, setCoinsUnlimited] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);

  useEffect(() => {
    setProfile(null);
    setCoinsUnlimited(false);
    if (!user) return;
    let cancelled = false;
    fetchWithAuth("/api/user/me")
      .then((r) => r.json())
      .then((d: MeResponse) => {
        if (!cancelled && d.user) {
          setProfile(d.user);
          setCoinsUnlimited(Boolean(d.coinsUnlimited));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function handleNotificationOptIn() {
    if (notifEnabled || notifLoading) return;
    if (!firebaseEnabled) return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;

    setNotifLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;

      const { getMessaging, register, onRegistered } = await import("firebase/messaging");
      const { app } = await import("@/lib/firebase");
      if (!app) return;
      const messaging = getMessaging(app);

      const swReg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

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
        className="sticky top-0 inset-x-0 z-50 h-16 border-b border-[var(--border-1)]"
        style={{ background: "var(--surface-raised)", backdropFilter: "blur(16px)" }}
      >
        <div className={`${APP_GUTTERS} relative h-full flex items-center justify-between`}>
          <div className="flex items-center shrink-0">
            <Link href="/dashboard" className="shrink-0 cursor-target">
              <BountixxLogo size={36} showWordmark />
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-1 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "cursor-target relative flex items-center gap-2 px-4 py-2 font-medium text-sm rounded-lg transition-colors",
                    active ? "text-haze" : "text-haze-2 hover:text-haze hover:bg-[var(--surface-hover)]"
                  )}
                >
                  <Icon size={15} aria-hidden />
                  {label}
                  {active && (
                    <motion.span
                      layoutId="topnav-pill"
                      className="absolute inset-0 bg-[var(--void-tint)] border border-[var(--border-accent)] rounded-lg -z-10"
                      transition={{ type: "spring", stiffness: 380, damping: 38 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center justify-end gap-2 sm:gap-3 shrink-0 ml-auto">
            <div className="hidden md:flex items-center gap-2 sm:gap-3 shrink-0">
              <div className="flex items-center gap-1.5 bg-[var(--surface-inset)] border border-[var(--border-2)] rounded-full px-3 py-1.5">
                <span className="text-coin-gold text-xs" aria-hidden>◈</span>
                <span className="font-stats font-semibold text-sm text-coin-gold tabular-nums">
                  {coinsUnlimited ? "∞" : (profile?.coinsBalance ?? 0)}
                </span>
              </div>

              <ThemeToggle />

              <button
                onClick={handleNotificationOptIn}
                disabled={notifLoading}
                className={cn(
                  "cursor-target relative transition-colors p-2 rounded-lg hover:bg-[var(--surface-hover)] disabled:opacity-40",
                  notifEnabled ? "text-success" : "text-haze-2 hover:text-haze"
                )}
                aria-label={notifEnabled ? "Notifications enabled" : "Enable notifications"}
                title={notifEnabled ? "Notifications enabled" : "Enable push notifications"}
              >
                {notifEnabled ? <Bell size={18} /> : <BellOff size={18} />}
                {!notifEnabled && (
                  <span
                    className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-plum"
                    aria-hidden
                  />
                )}
              </button>

              <Link href="/profile/me" className="cursor-target">
                {profile?.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.username}
                    className="w-8 h-8 rounded-full border-2 border-[var(--border-accent)] hover:border-plum transition-colors object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full border-2 border-[var(--border-accent)] bg-[var(--surface-inset)] flex items-center justify-center hover:border-plum transition-colors">
                    <span className="font-stats font-semibold text-[10px] text-haze">{initials}</span>
                  </div>
                )}
              </Link>

              <button
                onClick={handleLogout}
                disabled={signingOut}
                className="cursor-target flex items-center gap-1.5 text-xs font-medium text-haze-2 hover:text-danger border border-[var(--border-2)] hover:border-danger/40 rounded-lg px-3 py-2 transition-all disabled:opacity-40 whitespace-nowrap"
                aria-label="Sign out"
              >
                <LogOut size={14} aria-hidden />
                {signingOut ? "…" : "Sign out"}
              </button>
            </div>

            <ThemeToggle className="md:hidden" />

            <button
              className="md:hidden text-haze-2 hover:text-haze transition-colors p-2 rounded-lg hover:bg-[var(--surface-hover)]"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              onClick={() => setMobileOpen((o) => !o)}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed top-16 inset-x-0 z-40 border-b border-[var(--border-1)] pb-2"
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
                    "flex items-center gap-3 px-6 py-4 font-medium text-base border-b border-[var(--border-1)] transition-colors",
                    active
                      ? "text-plum bg-[var(--void-tint)]"
                      : "text-haze-2 hover:text-haze hover:bg-[var(--surface-hover)]"
                  )}
                >
                  <Icon size={18} aria-hidden />
                  {label}
                </Link>
              );
            })}
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-1.5 bg-[var(--surface-inset)] border border-[var(--border-2)] rounded-full px-3 py-1.5">
                <span className="text-coin-gold text-xs">◈</span>
                <span className="font-stats font-semibold text-sm text-coin-gold tabular-nums">
                  {coinsUnlimited ? "∞" : (profile?.coinsBalance ?? 0)}
                </span>
              </div>
              <span className="text-xs text-haze-3 font-medium">
                {profile?.rank ?? "Recruit"}
              </span>
              <button
                onClick={handleLogout}
                disabled={signingOut}
                className="flex items-center gap-2 text-xs font-medium text-danger border border-danger/30 rounded-lg px-3 py-2 hover:bg-danger/10 transition-colors disabled:opacity-40"
              >
                <LogOut size={13} />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-[var(--border-1)] flex"
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
              active ? "text-plum" : "text-haze-3 hover:text-haze-2"
            )}
          >
            <Icon size={20} aria-hidden />
            <span className="text-[9px] font-medium">
              {label.split(" ")[0]}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
