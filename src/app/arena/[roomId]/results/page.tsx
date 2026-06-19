"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Crown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { winnerReveal, staggerContainer, slideUp } from "@/lib/animations";
import { BountixxWordmark } from "@/components/BountixxLogo";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

interface ResultRow {
  userId: string;
  username: string | null;
  isWinner: boolean;
  testsPassed: number;
  testsTotal: number;
  submittedAt: string | null;
}

interface Player {
  id: string;
  userId: string;
  status: string;
  username: string | null;
}

interface RoomData {
  room: {
    id: string;
    name: string;
    status: string;
    adminId: string;
    prizePool: number;
    startedAt: string | null;
    category: string | null;
  };
  players: Player[];
  results: ResultRow[];
  isAdmin: boolean;
}

function Confetti() {
  const [particles] = useState(() => Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: ["#FF6B1A", "#F0A500", "#a855f7", "#FFFFFF", "#00D68F"][i % 5],
    delay: Math.random() * 1.5,
    duration: 2 + Math.random() * 2,
    size: 3 + Math.random() * 6,
  })));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.x}%`,
            top: "-20px",
            width: p.size,
            height: p.size,
            background: p.color,
          }}
          initial={{ y: -20, rotate: 0, opacity: 1 }}
          animate={{ y: "110vh", rotate: 720, opacity: [1, 1, 0] }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
        />
      ))}
    </div>
  );
}

function solveTime(startedAt: string | null, submittedAt: string | null): string {
  if (!startedAt || !submittedAt) return "—";
  const secs = Math.max(0, Math.round((new Date(submittedAt).getTime() - new Date(startedAt).getTime()) / 1000));
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  const [data, setData] = useState<RoomData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchWithAuth(`/api/rooms/${roomId}`);
        if (res.status === 401) {
          router.replace(`/login?next=/arena/${roomId}/results`);
          return;
        }
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as { error?: string };
          if (!cancelled) setError(err.error ?? "Arena not found");
          return;
        }
        const json = (await res.json()) as RoomData;
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setError("Network error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [roomId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cosmos flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="spinner" />
          <p className="font-space-mono text-xs text-haze-3 tracking-widest">LOADING RESULTS...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-cosmos flex items-center justify-center px-6">
        <div className="text-center flex flex-col items-center gap-5">
          <p className="font-zen-dots text-xl text-danger">ARENA UNAVAILABLE</p>
          <p className="font-rajdhani text-sm text-haze-2">{error || "This arena no longer exists."}</p>
          <Link href="/dashboard"><Button variant="primary" size="md">BACK TO DASHBOARD</Button></Link>
        </div>
      </div>
    );
  }

  const { room, players, results, isAdmin } = data;
  const winner = results.find((r) => r.isWinner) ?? null;
  const isCoding = room.category === "coding";

  // Standings: everyone who submitted (winner first), then competitors who never submitted
  const submittedIds = new Set(results.map((r) => r.userId));
  const nonSubmitters = players.filter(
    (p) => p.userId !== room.adminId && !submittedIds.has(p.userId)
  );

  return (
    <div className="min-h-screen bg-cosmos py-16 px-6 relative overflow-hidden flex flex-col items-center">
      {winner && <Confetti />}

      <div className="absolute inset-0 scanline-fx pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-2xl mx-auto flex flex-col items-center gap-10">
        {/* Logo */}
        <BountixxWordmark size={18} />

        <p className="font-space-mono text-[10px] text-haze-3 tracking-[4px] uppercase -mb-6">{room.name}</p>

        {/* Winner card — or "no winner" card */}
        <motion.div
          variants={winnerReveal}
          initial="hidden"
          animate="show"
          className={`w-full bg-cosmos-2 border border-cosmos-4 clip-arena p-8 flex flex-col items-center gap-4 text-center ${winner ? "glow-crown" : ""}`}
        >
          <Crown size={56} className={winner ? "text-crown" : "text-haze-3"} aria-hidden="true" />

          {winner ? (
            <>
              <motion.p
                className="font-orbitron font-black text-sm text-crown tracking-[8px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                WINNER
              </motion.p>

              <motion.h1
                className="font-zen-dots text-3xl text-haze"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9, type: "spring", damping: 14 }}
              >
                @{winner.username ?? "player"}
              </motion.h1>

              <p className="font-space-mono text-xs text-haze-2">
                Solved in {solveTime(room.startedAt, winner.submittedAt)}
              </p>

              {room.prizePool > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.3 }}
                  className="flex flex-col items-center gap-1"
                >
                  <AnimatedNumber
                    value={room.prizePool}
                    prefix="+"
                    suffix=" COINS"
                    className="font-orbitron font-black text-4xl text-crown"
                    duration={1.5}
                  />
                  <p className="font-space-mono text-[9px] text-haze-3 tracking-widest">FULL PRIZE POOL</p>
                </motion.div>
              )}
            </>
          ) : (
            <>
              <p className="font-orbitron font-black text-sm text-haze-3 tracking-[6px]">NO WINNER</p>
              <p className="font-rajdhani text-sm text-haze-2 max-w-xs">
                This arena ended without a correct submission. Entry fees stay in the vault.
              </p>
            </>
          )}
        </motion.div>

        {/* Final standings — real submissions only */}
        {(results.length > 0 || nonSubmitters.length > 0) && (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="w-full flex flex-col gap-2"
          >
            <p className="font-space-mono text-[10px] text-haze-3 tracking-widest mb-2">FINAL STANDINGS</p>

            {results.map((r, i) => (
              <motion.div
                key={r.userId}
                variants={slideUp}
                className={`flex items-center gap-4 px-5 py-3.5 border clip-arena-sm ${
                  r.isWinner ? "border-crown/40 bg-crown/5" : "border-cosmos-4 bg-cosmos-2"
                }`}
              >
                <span className={`font-orbitron font-bold text-lg w-6 text-center ${r.isWinner ? "text-crown" : "text-haze-3"}`}>
                  {i + 1}
                </span>
                <div className="w-9 h-9 rounded-full bg-cosmos-3 border border-cosmos-4 flex items-center justify-center shrink-0">
                  <span className="font-orbitron font-bold text-xs text-haze">
                    {(r.username ?? "??").slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-rajdhani font-bold text-sm text-haze truncate">@{r.username ?? "player"}</p>
                  <p className="font-space-mono text-[9px] text-haze-3">
                    {isCoding
                      ? `Passed ${r.testsPassed}/${r.testsTotal} tests`
                      : r.isWinner ? "Correct answer" : "Submitted"}
                  </p>
                </div>
                <span className="font-space-mono text-xs text-haze-3">
                  {solveTime(room.startedAt, r.submittedAt)}
                </span>
                <span className="font-orbitron font-bold text-sm text-crown shrink-0">
                  {r.isWinner && room.prizePool > 0 ? `+${room.prizePool}` : "—"}
                </span>
              </motion.div>
            ))}

            {nonSubmitters.map((p) => (
              <motion.div
                key={p.userId}
                variants={slideUp}
                className="flex items-center gap-4 px-5 py-3.5 border border-cosmos-4 bg-cosmos-2 clip-arena-sm opacity-60"
              >
                <span className="font-orbitron font-bold text-lg w-6 text-center text-haze-3">—</span>
                <div className="w-9 h-9 rounded-full bg-cosmos-3 border border-cosmos-4 flex items-center justify-center shrink-0">
                  <span className="font-orbitron font-bold text-xs text-haze">
                    {(p.username ?? "??").slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-rajdhani font-bold text-sm text-haze truncate">@{p.username ?? "player"}</p>
                  <p className="font-space-mono text-[9px] text-haze-3">
                    {p.status === "forfeited" ? "Disqualified" : "No submission"}
                  </p>
                </div>
                <span className="font-space-mono text-xs text-haze-3">—</span>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-wrap justify-center gap-3"
        >
          {isAdmin && (
            <Link href="/create"><Button variant="primary" size="md" magnetic>CREATE ANOTHER ARENA</Button></Link>
          )}
          <Link href="/dashboard"><Button variant={isAdmin ? "secondary" : "primary"} size="md">BACK TO DASHBOARD</Button></Link>
        </motion.div>
      </div>
    </div>
  );
}
