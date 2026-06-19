"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, PlusCircle, User, Wallet, Menu, X, LogOut } from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import { useAuth } from "@/components/providers/AuthProvider";
import { BountixxLogo } from "@/components/BountixxLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
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
  const { user, loading: authLoading } = useAuth();
  const { signOut } = useClerk();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [coinsUnlimited, setCoinsUnlimited] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setProfile(null);
      setCoinsUnlimited(false);
      return;
    }

    let cancelled = false;

    const loadProfile = async () => {
      try {
        const r = await fetchWithAuth("/api/user/me");
        if (!r.ok || cancelled) return;
        const d = (await r.json()) as MeResponse;
        if (!cancelled && d.user) {
          setProfile(d.user);
          setCoinsUnlimited(Boolean(d.coinsUnlimited));
        }
      } catch {
        // keep last known profile on transient failures
      }
    };

    const start = window.setTimeout(() => {
      void loadProfile();
    }, 400);

    const id = window.setInterval(() => void loadProfile(), 15_000);
    const refresh = () => {
      if (document.visibilityState === "visible") void loadProfile();
    };
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);

    return () => {
      cancelled = true;
      window.clearTimeout(start);
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [authLoading, user]);

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

          <nav className="hidden md:flex items-center gap-3 lg:gap-4 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "cursor-target relative flex items-center gap-2 px-5 py-2.5 font-medium text-sm rounded-lg transition-colors",
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
            <div className={APP_GUTTERS}>
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 py-4 font-medium text-base border-b border-[var(--border-1)] transition-colors",
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
            <div className="flex items-center justify-between py-4">
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
      className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-[var(--border-1)] flex pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]"
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
