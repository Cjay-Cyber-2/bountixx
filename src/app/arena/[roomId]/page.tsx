"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Upload, Users, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { useArenaGuard } from "@/hooks/useArenaGuard";
import { useToast } from "@/components/ui/Toast";

/* ─── Types ─── */
type RoomCategory = "coding" | "trivia" | "logic" | "math" | "writing" | "design" | "meme";
type RoomDifficulty = "rookie" | "challenger" | "elite" | "legendary";
type BountyTier = "bronze" | "silver" | "gold" | "mythic";
type PlayerStatus = "invited" | "joined" | "ready" | "completed" | "forfeited";

interface Player {
  id: string;
  userId: string;
  status: PlayerStatus;
  joinedAt: string | null;
  username: string | null;
  avatarUrl: string | null;
  rank: string | null;
}

interface TestCase {
  id: string;
  roomId: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  isActive: boolean;
}

interface Room {
  id: string;
  name: string;
  taskRaw: string;
  taskNormalised: string | null;
  category: RoomCategory | null;
  difficulty: RoomDifficulty | null;
  bountyTier: BountyTier;
  status: "lobby" | "live" | "ended" | "cancelled";
  adminId: string;
  playerCap: number;
  timerSeconds: number | null;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
}

interface RoomData {
  room: Room;
  players: Player[];
  testCases: TestCase[];
  mySubmission: { id: string; isWinner: boolean; testsPassed: number; testsTotal: number } | null;
  isAdmin: boolean;
}

interface TestResult {
  pass: boolean;
  output: string;
}

/* ─── Constants ─── */
const CAT_COLORS: Record<string, string> = {
  coding: "#FF6B1A",
  trivia: "#9B6BFF",
  logic: "#00D68F",
  math: "#F0A500",
  writing: "#9B8FC0",
  design: "#C084FC",
  meme: "#F472B6",
};

const DIFF_CHIP_COLOR: Record<RoomDifficulty, "ignite" | "crown" | "void" | "success" | "danger" | "haze"> = {
  rookie: "success",
  challenger: "crown",
  elite: "void",
  legendary: "danger",
};

function getDefaultCode(category: RoomCategory | null): string {
  if (category === "coding") {
    return `// Write your solution below
function solution(input) {
  // Your code here

}`;
  }
  return "";
}

/* ─── Timer component ─── */
function Timer({ seconds }: { seconds: number }) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const critical = seconds < 30 && seconds > 0;

  return (
    <motion.span
      className="font-orbitron font-bold text-2xl tabular-nums"
      style={{ color: critical ? "var(--danger)" : seconds === 0 ? "var(--danger)" : "var(--void)" }}
      animate={critical ? { scale: [1, 1.05, 1] } : { scale: 1 }}
      transition={{ duration: 1, repeat: critical ? Infinity : 0 }}
      aria-live="polite"
      aria-label={`${mins} minutes ${secs} seconds remaining`}
    >
      {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
    </motion.span>
  );
}

/* ─── Activity Feed ─── */
interface ActivityItem {
  id: string;
  type: "completed" | "forfeited" | "joined";
  player: string;
  text: string;
}

function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <div className="bg-cosmos-2 border border-cosmos-4 p-4 h-full">
      <p className="font-space-mono text-[10px] text-void tracking-widest mb-4 uppercase">
        Arena Activity
      </p>
      <AnimatePresence initial={false}>
        {items.length === 0 && (
          <p className="font-space-mono text-[10px] text-haze-3">Waiting for activity...</p>
        )}
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 mb-3"
          >
            <span
              className={`font-space-mono text-[10px] shrink-0 ${
                item.type === "completed"
                  ? "text-success"
                  : item.type === "forfeited"
                  ? "text-danger"
                  : "text-haze-3"
              }`}
            >
              {item.type === "completed" ? "✓" : item.type === "forfeited" ? "✗" : "●"}
            </span>
            <p className="font-space-mono text-[10px] text-haze-2 leading-relaxed">
              <span className="text-haze">@{item.player}</span> {item.text}
            </p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ─── Test Results display ─── */
interface TestResultsProps {
  testCases: TestCase[];
  results: TestResult[];
  ran: boolean;
}

function TestResults({ testCases, results, ran }: TestResultsProps) {
  return (
    <div className="bg-cosmos-2 border border-cosmos-4 p-4">
      <p className="font-space-mono text-[10px] text-void tracking-widest mb-4 uppercase">
        Test Results
      </p>
      {!ran && testCases.length === 0 && (
        <p className="font-space-mono text-[10px] text-haze-3">Run tests to see results</p>
      )}
      {testCases.map((tc, i) => {
        const result = results[i];
        const status = !ran ? "pending" : result?.pass ? "pass" : "fail";
        return (
          <div
            key={tc.id}
            className={`py-2 border-b border-cosmos-4/50 last:border-0 ${
              i % 2 === 0 ? "bg-cosmos/30" : ""
            }`}
          >
            <div className="flex items-center gap-3 mb-1">
              <span
                className={`font-space-mono text-xs w-4 text-center ${
                  status === "pass"
                    ? "text-success"
                    : status === "fail"
                    ? "text-danger"
                    : "text-haze-3"
                }`}
                aria-label={status}
              >
                {status === "pass" ? "✓" : status === "fail" ? "✗" : "○"}
              </span>
              <div className="flex-1 font-space-mono text-[10px] text-haze-2 min-w-0">
                <span className="text-haze-3">in:</span>{" "}
                <span className="text-haze truncate">{tc.input}</span>
              </div>
            </div>
            {ran && result && (
              <div className="pl-7 font-space-mono text-[9px] text-haze-3 space-y-0.5">
                <div>
                  <span className="text-haze-3">expected:</span>{" "}
                  <span className="text-success">{tc.expectedOutput}</span>
                </div>
                <div>
                  <span className="text-haze-3">got:</span>{" "}
                  <span className={result.pass ? "text-success" : "text-danger"}>
                    {result.output || "(empty)"}
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })}
      {ran && (
        <p className="font-space-mono text-[10px] text-haze-3 mt-3">
          Submit to run against hidden tests
        </p>
      )}
    </div>
  );
}

/* ─── Code Editor ─── */
interface CodeEditorProps {
  code: string;
  setCode: (v: string) => void;
  language: string;
  setLanguage: (v: string) => void;
  onRun: () => void;
  onSubmit: () => void;
  disabled: boolean;
  running: boolean;
  submitting: boolean;
  category: RoomCategory | null;
}

function CodeEditor({
  code,
  setCode,
  language,
  setLanguage,
  onRun,
  onSubmit,
  disabled,
  running,
  submitting,
  category,
}: CodeEditorProps) {
  const isCoding = category === "coding";
  const ext = language === "python" ? "py" : "js";

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex items-center justify-between border-b border-cosmos-4 bg-cosmos-3 px-4">
        <span className="font-space-mono text-xs text-haze py-2 border-b-2 border-void">
          solution.{ext}
        </span>
        {isCoding && (
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-cosmos border border-cosmos-4 text-haze-2 font-space-mono text-[10px] px-2 py-1 focus:outline-none focus:border-void my-1.5"
            disabled={disabled}
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
          </select>
        )}
      </div>
      {/* Editor */}
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="flex-1 p-4 bg-[#080612] text-haze font-space-mono text-sm resize-none
                   focus:outline-none leading-relaxed"
        style={{ minHeight: 280, caretColor: "var(--void)" }}
        spellCheck={false}
        aria-label="Code editor"
        disabled={disabled}
        onPaste={(e) => e.preventDefault()}
      />
      {/* Action bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-cosmos-3 border-t border-cosmos-4">
        <p className="font-space-mono text-[10px] text-haze-3">
          Ctrl+Enter to run · Ctrl+Shift+Enter to submit
        </p>
        <div className="flex items-center gap-2">
          {isCoding && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRun}
              disabled={disabled || running || submitting}
              loading={running}
              className="gap-1.5"
            >
              <Play size={12} aria-hidden="true" /> RUN TESTS
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={onSubmit}
            disabled={disabled || running || submitting}
            loading={submitting}
            className="gap-1.5"
          >
            <Upload size={12} aria-hidden="true" /> SUBMIT
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Answer Input (non-coding) ─── */
interface AnswerInputProps {
  answer: string;
  setAnswer: (v: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  submitting: boolean;
}

function AnswerInput({ answer, setAnswer, onSubmit, disabled, submitting }: AnswerInputProps) {
  return (
    <div className="flex flex-col h-full p-6 gap-4">
      <div>
        <label className="block font-space-mono text-[11px] text-void tracking-[3px] mb-3 uppercase">
          Your Answer
        </label>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="w-full h-48 p-4 bg-cosmos-2 border border-cosmos-4 text-haze font-rajdhani text-base
                     placeholder:text-haze-3 focus:outline-none focus:border-void resize-none"
          placeholder="Type your answer here..."
          disabled={disabled}
          aria-label="Answer input"
          style={{ borderRadius: 0 }}
        />
      </div>
      <Button
        variant="primary"
        size="md"
        onClick={onSubmit}
        disabled={disabled || submitting}
        loading={submitting}
        className="self-end gap-1.5"
      >
        <Upload size={14} aria-hidden="true" /> SUBMIT ANSWER
      </Button>
    </div>
  );
}

/* ─── Strike Warning Banner ─── */
function StrikeBanner({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -40 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-14 inset-x-0 z-40 flex items-center justify-center gap-2 px-4 py-2 bg-danger/90"
    >
      <AlertTriangle size={14} className="text-white" aria-hidden="true" />
      <p className="font-space-mono text-[11px] text-white tracking-widest">
        ANTI-CHEAT WARNING · STRIKE {count}/3
        {count >= 3 && " · DISQUALIFIED"}
      </p>
    </motion.div>
  );
}

/* ─── Time Up Banner ─── */
function TimeUpBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-cosmos/80 backdrop-blur-sm"
    >
      <div className="text-center">
        <p className="font-zen-dots text-6xl text-danger glow-ignite mb-4">TIME UP</p>
        <p className="font-space-mono text-sm text-haze-2">Redirecting to results...</p>
      </div>
    </motion.div>
  );
}

/* ─── Main Page ─── */
export default function ArenaPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;
  const { toast } = useToast();

  const [data, setData] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number>(300);
  const [timeUp, setTimeUp] = useState(false);

  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [answer, setAnswer] = useState("");

  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [testRan, setTestRan] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [strikes, setStrikes] = useState(0);
  const [disqualified, setDisqualified] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const prevPlayersRef = useRef<Player[]>([]);
  const activityIdRef = useRef(0);

  /* ─── Fetch room data ─── */
  const fetchRoom = useCallback(async (silent = false) => {
    try {
      const res = await fetch(`/api/rooms/${roomId}`);
      if (res.status === 401) {
        router.replace(`/login?next=/arena/${roomId}`);
        return;
      }
      if (!res.ok) return;

      const json = (await res.json()) as RoomData;

      // Redirects based on status
      if (json.room.status === "lobby") {
        router.replace(`/lobby/${roomId}`);
        return;
      }
      if (json.room.status === "ended") {
        router.replace(`/arena/${roomId}/results`);
        return;
      }

      // Derive activity from player status changes
      if (prevPlayersRef.current.length > 0) {
        const newItems: ActivityItem[] = [];
        for (const player of json.players) {
          const prev = prevPlayersRef.current.find((p) => p.userId === player.userId);
          if (prev && prev.status !== player.status) {
            const name = player.username ?? "Someone";
            if (player.status === "completed") {
              newItems.push({
                id: `act-${activityIdRef.current++}`,
                type: "completed",
                player: name,
                text: "submitted a solution",
              });
            } else if (player.status === "forfeited") {
              newItems.push({
                id: `act-${activityIdRef.current++}`,
                type: "forfeited",
                player: name,
                text: "was disqualified",
              });
            }
          } else if (!prev) {
            const name = player.username ?? "Someone";
            newItems.push({
              id: `act-${activityIdRef.current++}`,
              type: "joined",
              player: name,
              text: "entered the arena",
            });
          }
        }
        if (newItems.length > 0) {
          setActivityFeed((prev) => [...newItems, ...prev].slice(0, 20));
        }
      }

      prevPlayersRef.current = json.players;

      if (!silent) {
        // Set initial code from category default
        setCode((prev) => (prev === "" ? getDefaultCode(json.room.category) : prev));

        // Compute initial time left
        const timerSec = json.room.timerSeconds ?? 300;
        if (json.room.startedAt) {
          const elapsed = Math.floor(
            (Date.now() - new Date(json.room.startedAt).getTime()) / 1000
          );
          const remaining = Math.max(0, timerSec - elapsed);
          setTimeLeft(remaining);
          if (remaining === 0) setTimeUp(true);
        } else {
          setTimeLeft(timerSec);
        }
      }

      setData(json);
    } catch {
      // network error, ignore
    } finally {
      if (!silent) setLoading(false);
    }
  }, [roomId, router]);

  /* ─── Initial fetch ─── */
  useEffect(() => {
    fetchRoom(false);
  }, [fetchRoom]);

  /* ─── Poll every 3s ─── */
  useEffect(() => {
    const id = setInterval(() => fetchRoom(true), 3000);
    return () => clearInterval(id);
  }, [fetchRoom]);

  /* ─── Timer countdown ─── */
  useEffect(() => {
    if (timeUp || submitted || disqualified) return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          setTimeUp(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timeUp, submitted, disqualified]);

  /* ─── Auto-redirect on time up ─── */
  useEffect(() => {
    if (!timeUp) return;
    const t = setTimeout(() => {
      router.replace(`/arena/${roomId}/results`);
    }, 3000);
    return () => clearTimeout(t);
  }, [timeUp, router, roomId]);

  /* ─── Keyboard shortcuts ─── */
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (inputDisabled) return;
      if (e.ctrlKey && e.shiftKey && e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      } else if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        handleRunTests();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  });

  /* ─── Anti-cheat ─── */
  const handleStrike = useCallback(
    (count: number, _reason: string) => {
      setStrikes(count);
      if (count >= 3) {
        setDisqualified(true);
        toast({
          type: "error",
          title: "DISQUALIFIED",
          message: "Too many anti-cheat violations.",
        });
        // forfeit submission
        fetch(`/api/rooms/${roomId}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, language, answer: "__forfeit__" }),
        }).catch(() => {});
      } else {
        toast({
          type: "warning",
          title: `TAB SWITCH DETECTED (${count}/3)`,
          message: count === 2 ? "One more violation = disqualification." : undefined,
        });
      }
    },
    [toast, roomId, code, language]
  );

  useArenaGuard({ onStrike: handleStrike });

  /* ─── Derived state ─── */
  const inputDisabled =
    timeUp || disqualified || submitted || loading || data?.isAdmin === true;

  /* ─── Run tests ─── */
  async function handleRunTests() {
    if (!data || inputDisabled) return;
    setRunning(true);
    setTestRan(false);
    try {
      const res = await fetch(`/api/rooms/${roomId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language, runTestsOnly: true }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        toast({ type: "error", title: "Run failed", message: err.error });
        return;
      }
      const json = (await res.json()) as {
        testResults: { passed: number; total: number; results: TestResult[] };
        runOnly: boolean;
      };
      setTestResults(json.testResults.results);
      setTestRan(true);
      const { passed, total } = json.testResults;
      toast({
        type: passed === total && total > 0 ? "success" : "warning",
        title: `${passed}/${total} public tests passed`,
      });
    } catch {
      toast({ type: "error", title: "Network error" });
    } finally {
      setRunning(false);
    }
  }

  /* ─── Submit ─── */
  async function handleSubmit() {
    if (!data || inputDisabled) return;
    setSubmitting(true);
    try {
      const isCoding = data.room.category === "coding";
      const body = isCoding
        ? { code, language }
        : { answer };

      const res = await fetch(`/api/rooms/${roomId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        toast({ type: "error", title: "Submission failed", message: err.error });
        return;
      }

      const json = (await res.json()) as {
        won?: boolean;
        correct?: boolean;
        testResults?: { passed: number; total: number; results: TestResult[] };
        submission?: { id: string };
      };

      setSubmitted(true);

      if (json.won) {
        toast({
          type: "coins",
          title: "YOU WON! 🏆",
          message: "Redirecting to results...",
          duration: 2000,
        });
        setTimeout(() => router.replace(`/arena/${roomId}/results`), 2000);
      } else if (isCoding && json.testResults) {
        const { passed, total } = json.testResults;
        setTestResults(json.testResults.results);
        setTestRan(true);
        const pct = total > 0 ? Math.round((passed / total) * 100) : 0;
        toast({
          type: passed === 0 ? "error" : "info",
          title: passed === 0 ? "All tests failed" : `${pct}% tests passed`,
          message:
            passed === 0
              ? "You have been disqualified."
              : `${passed}/${total} hidden tests passed`,
        });
        if (passed === 0) setDisqualified(true);
      } else {
        // non-coding, wrong answer
        const correct = json.correct ?? false;
        toast({
          type: correct ? "success" : "error",
          title: correct ? "Correct! But someone was faster." : "Wrong answer",
        });
      }
    } catch {
      toast({ type: "error", title: "Network error" });
    } finally {
      setSubmitting(false);
    }
  }

  /* ─── Loading ─── */
  if (loading) {
    return (
      <div className="min-h-screen bg-cosmos flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="spinner" />
          <p className="font-space-mono text-xs text-haze-3 tracking-widest">
            LOADING ARENA...
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-cosmos flex items-center justify-center">
        <p className="font-rajdhani text-danger">Room not found or access denied.</p>
      </div>
    );
  }

  const { room, players, testCases } = data;
  const catColor = CAT_COLORS[room.category ?? "coding"] ?? "#FF6B1A";
  const isCoding = room.category === "coding";

  return (
    <div
      className="min-h-screen flex flex-col bg-cosmos select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      <AnimatePresence>
        {strikes > 0 && <StrikeBanner count={strikes} />}
      </AnimatePresence>
      <AnimatePresence>
        {timeUp && <TimeUpBanner />}
      </AnimatePresence>

      {/* ── Top bar ── */}
      <div className="fixed top-0 inset-x-0 z-30 flex items-center justify-between px-6 h-14 bg-cosmos-2 border-b border-cosmos-4">
        <div className="flex items-center gap-3">
          <span className="font-rajdhani font-bold text-sm text-haze truncate max-w-[180px]">
            {room.name}
          </span>
          {room.category && (
            <span
              className="font-space-mono text-[10px] px-2 py-0.5 border"
              style={{
                color: catColor,
                borderColor: `${catColor}40`,
                backgroundColor: `${catColor}15`,
              }}
            >
              {room.category.toUpperCase()}
            </span>
          )}
          {room.difficulty && (
            <Chip color={DIFF_CHIP_COLOR[room.difficulty]} size="xs">
              {room.difficulty.toUpperCase()}
            </Chip>
          )}
        </div>

        <Timer seconds={timeLeft} />

        <div className="flex items-center gap-2">
          <Users size={14} className="text-haze-3" aria-hidden="true" />
          <span className="font-space-mono text-xs text-haze-3">
            {players.length}/{room.playerCap}
          </span>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex flex-col lg:flex-row flex-1 pt-14">
        {/* Challenge panel */}
        <div className="w-full lg:w-[30%] lg:max-w-xs border-b lg:border-b-0 lg:border-r border-cosmos-4 bg-cosmos-2 p-5 overflow-y-auto">
          <p className="font-space-mono text-[10px] text-void tracking-widest mb-3 uppercase">
            Challenge Brief
          </p>
          <div className="font-rajdhani text-base text-haze leading-relaxed mb-4 whitespace-pre-wrap">
            {room.taskNormalised ?? room.taskRaw}
          </div>
          <div className="flex flex-wrap gap-2">
            {room.category && (
              <span
                className="font-space-mono text-[10px] px-2 py-0.5 border"
                style={{
                  color: catColor,
                  borderColor: `${catColor}40`,
                  backgroundColor: `${catColor}15`,
                }}
              >
                {room.category.toUpperCase()}
              </span>
            )}
            {room.difficulty && (
              <Chip color={DIFF_CHIP_COLOR[room.difficulty]} size="xs">
                {room.difficulty.toUpperCase()}
              </Chip>
            )}
            <Chip color="crown" size="xs">{room.bountyTier.toUpperCase()}</Chip>
          </div>

          {/* Players status */}
          <div className="mt-6">
            <p className="font-space-mono text-[10px] text-haze-3 tracking-widest mb-3 uppercase">
              Players
            </p>
            {players.map((p) => (
              <div key={p.id} className="flex items-center gap-2 mb-2">
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    p.status === "completed"
                      ? "bg-success"
                      : p.status === "forfeited"
                      ? "bg-danger"
                      : "bg-haze-3"
                  }`}
                />
                <span className="font-space-mono text-[10px] text-haze-2 truncate">
                  @{p.username ?? "player"}
                </span>
                <span className="font-space-mono text-[9px] text-haze-3 ml-auto shrink-0">
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Editor + results */}
        <div className="flex-1 flex flex-col lg:flex-row min-w-0">
          {/* Code editor or answer input */}
          <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-cosmos-4">
            {isCoding ? (
              <CodeEditor
                code={code}
                setCode={setCode}
                language={language}
                setLanguage={setLanguage}
                onRun={handleRunTests}
                onSubmit={handleSubmit}
                disabled={inputDisabled}
                running={running}
                submitting={submitting}
                category={room.category}
              />
            ) : (
              <AnswerInput
                answer={answer}
                setAnswer={setAnswer}
                onSubmit={handleSubmit}
                disabled={inputDisabled}
                submitting={submitting}
              />
            )}
          </div>

          {/* Right panel: test results + activity */}
          <div className="w-full lg:w-64 xl:w-80 flex flex-col gap-0">
            {isCoding && (
              <div className="flex-1 p-4 overflow-y-auto">
                <TestResults
                  testCases={testCases}
                  results={testResults}
                  ran={testRan}
                />
              </div>
            )}
            <div className={isCoding ? "border-t border-cosmos-4" : "flex-1 p-4"}>
              <ActivityFeed items={activityFeed} />
            </div>
          </div>
        </div>
      </div>

      {/* Disqualified overlay */}
      <AnimatePresence>
        {disqualified && !timeUp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed bottom-6 inset-x-6 z-40 flex items-center justify-center"
          >
            <div className="bg-danger/10 border border-danger/50 px-6 py-4 text-center clip-arena-sm">
              <p className="font-zen-dots text-danger text-sm">DISQUALIFIED</p>
              <p className="font-space-mono text-[10px] text-haze-3 mt-1">
                You have been removed from this arena.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
