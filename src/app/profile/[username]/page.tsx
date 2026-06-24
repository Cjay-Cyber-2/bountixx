"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Lock, Trophy, Camera, Pencil, Check, X } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useAuth } from "@/components/providers/AuthProvider";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppPage } from "@/components/landing/_section";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { XPBar } from "@/components/ui/XPBar";

const RANK_XP: Record<string, { label: string; max: number; next: string }> = {
  recruit:    { label: "RECRUIT",    max: 500,   next: "CHALLENGER" },
  challenger: { label: "CHALLENGER", max: 2000,  next: "ELITE"      },
  elite:      { label: "ELITE",      max: 7500,  next: "CHAMPION"   },
  champion:   { label: "CHAMPION",   max: 20000, next: "LEGENDARY"  },
  legendary:  { label: "LEGENDARY",  max: 20000, next: "MAX"        },
};

const ALL_BADGES = [
  { id: "first_blood",  name: "First Blood",    desc: "Win your first arena"             },
  { id: "unstoppable",  name: "Unstoppable",     desc: "Win 5 arenas in a row"           },
  { id: "code_beast",   name: "Code Beast",      desc: "Win 10 coding challenges"        },
  { id: "puzzle_king",  name: "Puzzle King",     desc: "Win 10 logic challenges"         },
  { id: "bounty_hunter",name: "Bounty Hunter",   desc: "Collect 1,000 coins total"      },
  { id: "arena_host",   name: "Arena Host",      desc: "Create 20 arenas"               },
  { id: "legendary_solver", name: "Legendary Solver", desc: "Reach Legendary rank"      },
  { id: "speed_demon",  name: "Speed Demon",     desc: "Win in under 60 seconds"        },
];

const CATEGORY_COLORS: Record<string, string> = {
  coding:  "#7C5CFF",
  trivia:  "#A78BFA",
  logic:   "#22D3EE",
  math:    "#F0A500",
  writing: "#F472B6",
  design:  "#34D399",
  meme:    "#FB7185",
};

type UserProfile = {
  id: string;
  username: string;
  avatarUrl: string | null;
  coinsBalance: number;
  xp: number;
  rank: string;
  roomsCreatedCount: number;
  createdAt: string;
};

type DashboardStats = {
  roomsPlayed: number;
  roomsWon: number;
  winRate: number;
  totalXp: number;
  recentRooms: { name: string; category: string; place: string; coins: number; date: string }[];
};

type Achievement = { badgeId: string; earnedAt: string };

export default function ProfilePage() {
  const { user } = useAuth();
  const { user: clerkUser } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [savingUsername, setSavingUsername] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const [profRes, statsRes, achRes] = await Promise.all([
        fetchWithAuth("/api/user/me"),
        fetchWithAuth("/api/dashboard"),
        fetchWithAuth("/api/achievements"),
      ]);
      const profData = await profRes.json();
      const statsData = await statsRes.json();
      const achData = await achRes.json();

      if (profData.user) setProfile(profData.user);
      if (statsData) setStats(statsData);
      if (achData.achievements) setAchievements(achData.achievements);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchProfile();
    else setLoading(false);
  }, [user, fetchProfile]);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !clerkUser) return;
    setUploadingAvatar(true);
    try {
      await clerkUser.setProfileImage({ file });
      await clerkUser.reload();
      const url = clerkUser.imageUrl;

      await fetchWithAuth("/api/user/me", {
        method: "PUT",
        body: JSON.stringify({ avatarUrl: url }),
      });

      setProfile((p) => p ? { ...p, avatarUrl: url } : p);
    } catch {
      // ignored
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSaveUsername() {
    if (!usernameInput.trim() || !user) return;
    setSavingUsername(true);
    setUsernameError("");
    try {
      const res = await fetchWithAuth("/api/user/me", {
        method: "PUT",
        body: JSON.stringify({ username: usernameInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setUsernameError(data.error ?? "Failed to update username");
        return;
      }
      setProfile((p) => p ? { ...p, username: usernameInput.trim() } : p);
      setEditingUsername(false);
    } catch {
      setUsernameError("Something went wrong");
    } finally {
      setSavingUsername(false);
    }
  }

  const rankInfo = RANK_XP[profile?.rank ?? "recruit"] ?? RANK_XP["recruit"];
  const earnedBadgeIds = new Set(achievements.map((a) => a.badgeId));
  const initials = profile?.username?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <AppLayout>
      <AppPage>
        {/* Banner card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative overflow-hidden rounded-2xl border bg-[var(--surface-card)] mb-10 md:mb-14"
          style={{ borderColor: "var(--border-1)" }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 70% 100% at 12% 100%, var(--void-tint), transparent 70%)",
            }}
            aria-hidden
          />
          <div className="relative px-6 md:px-10 py-9 md:py-12 flex flex-col sm:flex-row sm:items-center justify-between gap-8">
            <div className="flex items-center gap-5 md:gap-7 min-w-0">
              <div className="relative shrink-0 group">
                <div
                  className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[var(--surface-inset)] flex items-center justify-center cursor-pointer overflow-hidden"
                  style={{
                    border: "3px solid var(--brand-primary)",
                    boxShadow: "0 0 24px var(--glow-1)",
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  aria-label="Change profile picture"
                >
                  {uploadingAvatar ? (
                    <div className="w-5 h-5 border-2 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin" />
                  ) : profile?.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="font-stats font-black text-2xl md:text-3xl text-[var(--brand-primary)]">
                      {loading ? "…" : initials}
                    </span>
                  )}
                </div>
                <div
                  className="absolute inset-0 rounded-full bg-cosmos/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                  aria-hidden
                >
                  <Camera size={20} className="text-haze" />
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>

              <div className="min-w-0 flex-1">
                {editingUsername ? (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-display text-[var(--brand-primary)] text-base">@</span>
                    <input
                      autoFocus
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveUsername();
                        if (e.key === "Escape") setEditingUsername(false);
                      }}
                      className="bg-[var(--surface-inset)] border border-[var(--border-accent)] rounded-lg px-3 py-1.5 font-display text-lg md:text-xl text-haze focus:outline-none focus:border-[var(--brand-primary)] w-44"
                      maxLength={30}
                    />
                    <button
                      onClick={handleSaveUsername}
                      disabled={savingUsername}
                      className="text-success hover:opacity-80 transition-opacity disabled:opacity-40"
                      aria-label="Save username"
                    >
                      <Check size={18} />
                    </button>
                    <button
                      onClick={() => { setEditingUsername(false); setUsernameError(""); }}
                      className="text-haze-3 hover:text-haze-2 transition-colors"
                      aria-label="Cancel"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 mb-2 group/username">
                    <h1 className="font-display text-2xl md:text-3xl lg:text-4xl text-haze truncate">
                      @{loading ? "loading…" : (profile?.username ?? "arena_player")}
                    </h1>
                    {user && (
                      <button
                        onClick={() => {
                          setUsernameInput(profile?.username ?? "");
                          setEditingUsername(true);
                        }}
                        className="text-haze-3 hover:text-[var(--brand-primary)] transition-colors opacity-0 group-hover/username:opacity-100"
                        aria-label="Edit username"
                      >
                        <Pencil size={15} />
                      </button>
                    )}
                  </div>
                )}
                {usernameError && (
                  <p className="font-body text-xs text-danger mb-2">{usernameError}</p>
                )}
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className="font-mono text-[10px] md:text-xs px-2.5 py-1 rounded-md uppercase tracking-widest text-[var(--brand-primary)]"
                    style={{
                      background: "var(--void-tint)",
                      border: "1px solid var(--border-accent)",
                    }}
                  >
                    {rankInfo.label}
                  </span>
                  <span className="font-mono text-[10px] md:text-xs text-haze-3 uppercase tracking-wide">
                    {profile?.createdAt
                      ? `Joined ${new Date(profile.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`
                      : ""}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
              <span className="font-mono text-[10px] text-haze-3 tracking-widest uppercase">
                Balance
              </span>
              <span className="font-stats font-black text-3xl md:text-4xl text-coin-gold leading-none">
                {profile?.coinsBalance ?? 0}
                <span className="text-base ml-1.5 align-middle">◈</span>
              </span>
            </div>
          </div>
        </motion.div>

        <div className="flex flex-col gap-10 md:gap-14">
          {/* Stats */}
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.07 } } }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6"
          >
            {[
              { label: "Arenas played", value: stats?.roomsPlayed ?? 0 },
              { label: "Arenas won",    value: stats?.roomsWon ?? 0 },
              { label: "Win rate",      value: stats?.winRate ?? 0, suffix: "%" },
              { label: "Total XP",      value: stats?.totalXp ?? profile?.xp ?? 0 },
            ].map((s) => (
              <motion.div
                key={s.label}
                variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
                className="rounded-2xl bg-[var(--surface-inset)] border border-[var(--border-1)] px-6 py-7 md:px-7 md:py-8 min-h-[140px] flex flex-col justify-end shadow-sm"
              >
                <AnimatedNumber
                  value={s.value}
                  suffix={s.suffix}
                  className="font-stats font-black text-3xl md:text-4xl text-haze block leading-none mb-3"
                  format={!s.suffix}
                />
                <p className="font-mono text-[10px] text-haze-3 tracking-[1.5px] uppercase leading-snug">
                  {s.label}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* XP bar */}
          <div className="rounded-2xl bg-[var(--surface-inset)] border border-[var(--border-1)] p-7 md:p-9 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
              <p className="font-display text-base md:text-lg text-haze tracking-wide">{rankInfo.label}</p>
              <p className="font-mono text-[11px] md:text-xs text-[var(--brand-primary)] tracking-wide">
                {(profile?.xp ?? 0).toLocaleString()} / {rankInfo.max.toLocaleString()} XP
                {rankInfo.next !== "MAX" && ` → ${rankInfo.next}`}
              </p>
            </div>
            <XPBar current={profile?.xp ?? 0} max={rankInfo.max} thick color="void" />
          </div>

          {/* Achievements */}
          <div>
            <h2 className="font-display text-lg md:text-xl text-haze tracking-wide mb-5">ACHIEVEMENTS</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {ALL_BADGES.map((badge) => {
                const earned = earnedBadgeIds.has(badge.id);
                return (
                  <div
                    key={badge.id}
                    className="relative rounded-2xl bg-[var(--surface-inset)] p-6 md:p-7 min-h-[150px] flex flex-col gap-3 shadow-sm transition-colors"
                    style={{
                      border: earned
                        ? "1px solid var(--border-accent)"
                        : "1px solid var(--border-1)",
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{
                        background: earned ? "var(--void-tint)" : "var(--surface-hover)",
                        border: earned ? "1px solid var(--border-accent)" : "1px solid var(--border-1)",
                      }}
                    >
                      {earned ? (
                        <Trophy size={18} className="text-[var(--brand-primary)]" aria-hidden />
                      ) : (
                        <Lock size={16} className="text-haze-3" aria-hidden />
                      )}
                    </div>
                    <p className={`font-display text-base md:text-lg leading-snug ${earned ? "text-haze" : "text-haze-2"}`}>
                      {badge.name}
                    </p>
                    <p className="font-body text-sm text-haze-2 leading-relaxed">{badge.desc}</p>
                    {!earned && (
                      <span className="absolute top-4 right-4 font-mono text-[9px] text-haze-3 tracking-wider px-2 py-0.5 rounded border border-[var(--border-1)]">
                        LOCKED
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent arenas */}
          {stats?.recentRooms && stats.recentRooms.length > 0 && (
            <div>
              <h2 className="font-display text-lg md:text-xl text-haze tracking-wide mb-5">RECENT ARENAS</h2>
              <div className="rounded-2xl overflow-hidden border border-[var(--border-1)]">
                {stats.recentRooms.map((h, i) => {
                  const catColor = CATEGORY_COLORS[h.category] ?? "#A78BFA";
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-4 px-5 md:px-7 py-4 bg-[var(--surface-inset)] border-b border-[var(--border-1)] last:border-0 hover:bg-[var(--surface-hover)] transition-colors"
                    >
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: catColor }} aria-hidden />
                      <div className="flex-1 min-w-0">
                        <p className="font-body font-semibold text-sm md:text-base text-haze truncate">{h.name}</p>
                        <p className="font-mono text-[10px] md:text-xs text-haze-3 mt-1">
                          <span style={{ color: catColor }}>{h.category}</span> · {h.place} · {h.date}
                        </p>
                      </div>
                      <span className="font-stats font-bold text-sm md:text-base text-coin-gold shrink-0">+{h.coins} ◈</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </AppPage>
    </AppLayout>
  );
}
