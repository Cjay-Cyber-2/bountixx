"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Lock, Trophy, Camera, Pencil, Check, X } from "lucide-react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { useAuth } from "@/components/providers/AuthProvider";
import { AppLayout } from "@/components/layout/AppLayout";
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
  coding: "#FF6B1A", trivia: "#9B6BFF", logic: "#00D68F", math: "#F0A500",
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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  // Editing state
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [savingUsername, setSavingUsername] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const [profRes, statsRes, achRes] = await Promise.all([
        fetch("/api/user/me"),
        fetch("/api/dashboard"),
        fetch("/api/achievements"),
      ]);
      const profData = await profRes.json();
      const statsData = await statsRes.json();
      const achData = await achRes.json();

      if (profData.user) setProfile(profData.user);
      if (statsData) setStats(statsData);
      if (achData.achievements) setAchievements(achData.achievements);
    } catch {
      // silently fail - show placeholder data
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
    if (!file || !user) return;
    setUploadingAvatar(true);
    try {
      const storageRef = ref(storage, `avatars/${user.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      await fetch("/api/user/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: url }),
      });

      setProfile((p) => p ? { ...p, avatarUrl: url } : p);
    } catch {
      // fail silently for now
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSaveUsername() {
    if (!usernameInput.trim() || !user) return;
    setSavingUsername(true);
    setUsernameError("");
    try {
      const res = await fetch("/api/user/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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
      <div className="w-full max-w-[1280px] mx-auto min-h-[calc(100vh-76px)]">
        {/* Banner */}
        <div
          className="relative border-b border-cosmos-4"
          style={{
            background:
              "repeating-linear-gradient(135deg, rgba(45,27,105,0.25) 0 1px, transparent 1px 20px)",
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 70% 100% at 20% 100%, rgba(155,107,255,0.12), transparent 70%)" }}
            aria-hidden
          />
          <div className="relative px-5 md:px-10 pt-10 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
              {/* Avatar + identity */}
              <div className="flex items-end gap-5">
                {/* Avatar circle — clickable to upload */}
                <div className="relative shrink-0 group">
                  <div
                    className="w-20 h-20 rounded-full bg-cosmos-3 flex items-center justify-center cursor-pointer"
                    style={{ border: "3px solid #9B6BFF", boxShadow: "0 0 24px rgba(155,107,255,0.3)" }}
                    onClick={() => fileInputRef.current?.click()}
                    role="button"
                    aria-label="Change profile picture"
                  >
                    {uploadingAvatar ? (
                      <div className="w-5 h-5 border-2 border-void border-t-transparent rounded-full animate-spin" />
                    ) : profile?.avatarUrl ? (
                      <img
                        src={profile.avatarUrl}
                        alt={profile.username}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="font-orbitron font-bold text-2xl text-void">
                        {loading ? "…" : initials}
                      </span>
                    )}
                  </div>
                  {/* Camera overlay */}
                  <div
                    className="absolute inset-0 rounded-full bg-cosmos/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                    aria-hidden
                  >
                    <Camera size={18} className="text-haze" />
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </div>

                <div className="pb-1">
                  {/* Username — editable */}
                  {editingUsername ? (
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-zen-dots text-void text-sm">@</span>
                      <input
                        autoFocus
                        value={usernameInput}
                        onChange={(e) => setUsernameInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveUsername();
                          if (e.key === "Escape") setEditingUsername(false);
                        }}
                        className="bg-cosmos-2 border border-void px-2 py-1 font-zen-dots text-lg text-haze focus:outline-none w-40"
                        style={{ borderRadius: 0 }}
                        maxLength={30}
                      />
                      <button
                        onClick={handleSaveUsername}
                        disabled={savingUsername}
                        className="text-success hover:text-success/80 transition-colors disabled:opacity-40"
                        aria-label="Save username"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => { setEditingUsername(false); setUsernameError(""); }}
                        className="text-haze-3 hover:text-haze-2 transition-colors"
                        aria-label="Cancel"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mb-1.5 group/username">
                      <h1 className="font-zen-dots text-xl md:text-2xl text-haze">
                        @{loading ? "loading…" : (profile?.username ?? "arena_player")}
                      </h1>
                      {user && (
                        <button
                          onClick={() => {
                            setUsernameInput(profile?.username ?? "");
                            setEditingUsername(true);
                          }}
                          className="text-haze-3 hover:text-void transition-colors opacity-0 group-hover/username:opacity-100"
                          aria-label="Edit username"
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                    </div>
                  )}
                  {usernameError && (
                    <p className="font-rajdhani text-xs text-danger mb-1.5">{usernameError}</p>
                  )}
                  <div className="flex items-center gap-2.5">
                    <span
                      className="font-space-mono text-[10px] px-2 py-0.5 text-void"
                      style={{ background: "rgba(155,107,255,0.12)", border: "1px solid rgba(155,107,255,0.3)" }}
                    >
                      {rankInfo.label}
                    </span>
                    <span className="font-space-mono text-[10px] text-haze-3">
                      {profile?.createdAt
                        ? `Joined ${new Date(profile.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`
                        : ""}
                    </span>
                  </div>
                </div>
              </div>

              {/* Coin balance */}
              <div className="flex items-center gap-2 sm:flex-col sm:items-end pb-1">
                <span className="font-space-mono text-[9px] text-haze-3 tracking-[2px] uppercase">Balance</span>
                <span className="font-orbitron font-bold text-2xl text-crown">
                  {profile?.coinsBalance ?? 0} <span className="text-xs">◈</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 md:px-10 py-8 flex flex-col gap-9">
          {/* Stats */}
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.07 } } }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4"
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
                className="bg-cosmos-2 clip-arena p-5"
                style={{ border: "1px solid rgba(45,27,105,0.7)" }}
              >
                <AnimatedNumber
                  value={s.value}
                  suffix={s.suffix}
                  className="font-orbitron font-black text-2xl md:text-3xl text-haze block mb-1.5 leading-none"
                  format={!s.suffix}
                />
                <p className="font-space-mono text-[9px] text-haze-3 tracking-[2px] uppercase">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* XP bar */}
          <div className="bg-cosmos-2 clip-arena p-6" style={{ border: "1px solid rgba(45,27,105,0.7)" }}>
            <div className="flex items-center justify-between mb-4">
              <p className="font-orbitron font-bold text-sm text-haze tracking-wide">{rankInfo.label}</p>
              <p className="font-space-mono text-[11px] text-void">
                {(profile?.xp ?? 0).toLocaleString()} / {rankInfo.max.toLocaleString()} XP
                {rankInfo.next !== "MAX" && ` → ${rankInfo.next}`}
              </p>
            </div>
            <XPBar current={profile?.xp ?? 0} max={rankInfo.max} thick color="void" />
          </div>

          {/* Achievements */}
          <div>
            <h2 className="font-orbitron font-bold text-base text-haze tracking-wide mb-4">ACHIEVEMENTS</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {ALL_BADGES.map((badge) => {
                const earned = earnedBadgeIds.has(badge.id);
                return (
                  <div
                    key={badge.id}
                    className="relative bg-cosmos-2 clip-arena-sm p-4"
                    style={{
                      border: earned
                        ? "1px solid rgba(155,107,255,0.35)"
                        : "1px solid rgba(45,27,105,0.5)",
                    }}
                  >
                    <div
                      className="w-9 h-9 flex items-center justify-center mb-3 clip-arena-sm"
                      style={{
                        background: earned ? "rgba(155,107,255,0.14)" : "rgba(45,27,105,0.3)",
                        border: earned ? "1px solid rgba(155,107,255,0.4)" : "1px solid rgba(74,63,112,0.5)",
                      }}
                    >
                      {earned ? (
                        <Trophy size={16} className="text-void" aria-hidden />
                      ) : (
                        <Lock size={14} className="text-haze-3" aria-hidden />
                      )}
                    </div>
                    <p className={`font-rajdhani font-bold text-sm mb-1 ${earned ? "text-haze" : "text-haze-2"}`}>
                      {badge.name}
                    </p>
                    <p className="font-rajdhani text-xs text-haze-3 leading-snug">{badge.desc}</p>
                    {!earned && (
                      <span className="absolute top-3 right-3 font-space-mono text-[8px] text-haze-3 tracking-wider">LOCKED</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent arenas */}
          {stats?.recentRooms && stats.recentRooms.length > 0 && (
            <div>
              <h2 className="font-orbitron font-bold text-base text-haze tracking-wide mb-4">RECENT ARENAS</h2>
              <div className="clip-arena overflow-hidden" style={{ border: "1px solid rgba(45,27,105,0.7)" }}>
                {stats.recentRooms.map((h, i) => {
                  const catColor = CATEGORY_COLORS[h.category] ?? "#9B8FC0";
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-4 md:px-5 py-3.5 bg-cosmos-2 border-b border-cosmos-4 last:border-0 hover:bg-cosmos-3 transition-colors"
                    >
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: catColor }} aria-hidden />
                      <div className="flex-1 min-w-0">
                        <p className="font-rajdhani font-bold text-sm text-haze truncate">{h.name}</p>
                        <p className="font-space-mono text-[10px] text-haze-3 mt-0.5">
                          <span style={{ color: catColor }}>{h.category}</span> · {h.place} · {h.date}
                        </p>
                      </div>
                      <span className="font-orbitron font-bold text-sm text-crown shrink-0">+{h.coins} ◈</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
