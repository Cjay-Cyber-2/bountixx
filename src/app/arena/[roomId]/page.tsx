"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Upload, Users, AlertTriangle, Crown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { useArenaGuard } from "@/hooks/useArenaGuard";
import { useToast } from "@/components/ui/Toast";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { getLanguage } from "@/lib/languages";

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
  language: string | null;
  starterCode: string | null;
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
  coding:  "#FF6B1A",
  trivia:  "#9B6BFF",
  logic:   "#00D68F",
  math:    "#F0A500",
  writing: "#9B8FC0",
  design:  "#C084FC",
  meme:    "#F472B6",
};

const DIFF_CHIP_COLOR: Record<RoomDifficulty, "ignite" | "crown" | "void" | "success" | "danger" | "haze"> = {
  rookie:     "success",
  challenger: "crown",
  elite:      "void",
  legendary:  "danger",
};

function getDefaultCode(category: RoomCategory | null, language: string | null): string {
  if (category === "coding") {
    return getLanguage(language).template;
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
      style={{ color: critical || seconds === 0 ? "var(--danger)" : "var(--void)" }}
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
                item.type === "completed" ? "text-success" : item.type === "forfeited" ? "text-danger" : "text-haze-3"
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

/* ─── Test Results ─── */
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
          <div key={tc.id} className={`py-2 border-b border-cosmos-4/50 last:border-0 ${i % 2 === 0 ? "bg-cosmos/30" : ""}`}>
            <div className="flex items-center gap-3 mb-1">
              <span className={`font-space-mono text-xs w-4 text-center ${status === "pass" ? "text-success" : status === "fail" ? "text-danger" : "text-haze-3"}`} aria-label={status}>
                {status === "pass" ? "✓" : status === "fail" ? "✗" : "○"}
              </span>
              <div className="flex-1 font-space-mono text-[10px] text-haze-2 min-w-0">
                <span className="text-haze-3">in:</span>{" "}
                <span className="text-haze truncate">{tc.input}</span>
              </div>
            </div>
            {ran && result && (
              <div className="pl-7 font-space-mono text-[9px] text-haze-3 space-y-0.5">
                <div><span className="text-haze-3">expected:</span> <span className="text-success">{tc.expectedOutput}</span></div>
                <div><span className="text-haze-3">got:</span> <span className={result.pass ? "text-success" : "text-danger"}>{result.output || "(empty)"}</span></div>
              </div>
            )}
          </div>
        );
      })}
      {ran && <p className="font-space-mono text-[10px] text-haze-3 mt-3">Submit to run against hidden tests</p>}
    </div>
  );
}

/* ─── Code Editor ─── */
interface CodeEditorProps {
  code: string;
  setCode: (v: string) => void;
  language: string;
  onRun: () => void;
  onSubmit: () => void;
  disabled: boolean;
  running: boolean;
  submitting: boolean;
}

function CodeEditor({ code, setCode, language, onRun, onSubmit, disabled, running, submitting }: CodeEditorProps) {
  const spec = getLanguage(language);
  const lineCount = Math.max(code.split("\n").length, 1);

  // Tab inserts two spaces instead of moving focus, for a real editor feel.
  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Tab") {
      e.preventDefault();
      const el = e.currentTarget;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const next = code.slice(0, start) + "  " + code.slice(end);
      setCode(next);
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + 2;
      });
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* IDE-style tab bar with the locked, AI-analysed language */}
      <div className="flex items-center justify-between border-b border-cosmos-4 bg-cosmos-3 px-4">
        <div className="flex items-center gap-2 py-2">
          <span className="w-2 h-2 rounded-full bg-ignite" aria-hidden />
          <span className="font-space-mono text-xs text-haze">solution.{spec.ext}</span>
        </div>
        <span
          className="font-space-mono text-[10px] px-2 py-1 my-1.5 border text-ignite"
          style={{ borderColor: "rgba(255,107,26,0.35)", background: "rgba(255,107,26,0.08)" }}
          title="Language set by the AI from the challenge"
        >
          {spec.label}
        </span>
      </div>

      {/* Gutter + textarea */}
      <div className="flex-1 flex overflow-hidden bg-[#080612] min-h-[280px]">
        <div
          aria-hidden
          className="select-none py-4 pl-3 pr-2 text-right font-space-mono text-xs leading-relaxed text-haze-3/50 bg-[#0b0817] border-r border-cosmos-4/60"
        >
          {Array.from({ length: lineCount }).map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={handleKey}
          className="flex-1 p-4 bg-transparent text-haze font-space-mono text-sm resize-none focus:outline-none leading-relaxed"
          style={{ caretColor: "var(--void)" }}
          spellCheck={false}
          aria-label="Code editor"
          disabled={disabled}
          onPaste={(e) => e.preventDefault()}
        />
      </div>

      <div className="flex items-center justify-between gap-2 px-4 py-3 bg-cosmos-3 border-t border-cosmos-4">
        <p className="hidden sm:block font-space-mono text-[10px] text-haze-3">Ctrl+Enter run · Ctrl+Shift+Enter submit</p>
        <div className="flex items-center gap-2 ml-auto">
          <Button variant="ghost" size="sm" onClick={onRun} disabled={disabled || running || submitting} loading={running} className="gap-1.5">
            <Play size={12} aria-hidden="true" /> RUN
          </Button>
          <Button variant="primary" size="sm" onClick={onSubmit} disabled={disabled || running || submitting} loading={submitting} className="gap-1.5">
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
    <div className="flex flex-col h-full">
      <div className="px-5 pt-4 pb-3 border-b border-cosmos-4 bg-cosmos-3 shrink-0">
        <p className="font-space-mono text-[11px] text-void tracking-[3px] uppercase">Your Answer</p>
        <p className="font-rajdhani text-xs text-haze-3 mt-0.5">Case-insensitive · Ctrl+Enter to submit</p>
      </div>
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            onSubmit();
          }
        }}
        className="flex-1 p-5 bg-[#080612] text-haze font-rajdhani text-lg
                   placeholder:text-haze-3/40 focus:outline-none resize-none"
        style={{ caretColor: "var(--void)" }}
        placeholder="Type your answer here..."
        disabled={disabled}
        aria-label="Answer input"
      />
      <div className="flex items-center justify-end px-5 py-3 bg-cosmos-3 border-t border-cosmos-4 shrink-0">
        <Button
          variant="primary"
          size="md"
          onClick={onSubmit}
          disabled={disabled || submitting}
          loading={submitting}
          className="gap-1.5"
        >
          <Upload size={14} aria-hidden="true" /> SUBMIT ANSWER
        </Button>
      </div>
    </div>
  );
}

/* ─── Host Panel (shown instead of the input area for the arena creator) ─── */
interface HostPanelProps {
  players: Player[];
  adminId: string;
  roomId: string;
  onEnded: () => void;
}

function HostPanel({ players, adminId, roomId, onEnded }: HostPanelProps) {
  const [ending, setEnding] = useState(false);
  const competitors = players.filter((p) => p.userId !== adminId);

  async function handleEndArena() {
    setEnding(true);
    try {
      await fetchWithAuth(`/api/rooms/${roomId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ended" }),
      });
      onEnded();
    } catch {
      setEnding(false);
    }
  }

  const done = competitors.filter((p) => p.status === "completed" || p.status === "forfeited").length;
  const total = competitors.length;

  return (
    <div className="flex flex-col h-full">
      {/* Host badge */}
      <div className="px-5 pt-4 pb-3 border-b border-cosmos-4 bg-cosmos-3 shrink-0 flex items-center gap-3">
        <div className="w-8 h-8 flex items-center justify-center shrink-0" style={{ background: "rgba(240,165,0,0.12)", border: "1px solid rgba(240,165,0,0.3)" }}>
          <Crown size={14} className="text-crown" aria-hidden="true" />
        </div>
        <div>
          <p className="font-space-mono text-[11px] text-crown tracking-[2px] uppercase">Host View</p>
          <p className="font-rajdhani text-xs text-haze-3">You created this arena — you cannot compete</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-5 py-3 border-b border-cosmos-4 bg-cosmos-2 shrink-0">
        <div className="flex justify-between items-center mb-1.5">
          <p className="font-space-mono text-[9px] text-haze-3 uppercase tracking-widest">Competitors finished</p>
          <p className="font-orbitron font-bold text-sm text-haze">{done}/{total}</p>
        </div>
        <div className="h-1 bg-cosmos-4 w-full">
          <div
            className="h-1 bg-void transition-all duration-500"
            style={{ width: total > 0 ? `${(done / total) * 100}%` : "0%" }}
          />
        </div>
      </div>

      {/* Competitors list */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <p className="font-space-mono text-[9px] text-haze-3 tracking-widest mb-3 uppercase">Live standings</p>
        {competitors.length === 0 && (
          <p className="font-space-mono text-[10px] text-haze-3">No competitors yet.</p>
        )}
        {competitors.map((p, i) => (
          <div
            key={p.id}
            className="flex items-center gap-3 py-2.5 border-b border-cosmos-4/40 last:border-0"
          >
            <span className="font-orbitron text-[10px] text-haze-3 w-4 shrink-0">{i + 1}</span>
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                p.status === "completed" ? "bg-success" : p.status === "forfeited" ? "bg-danger" : "bg-haze-3"
              }`}
            />
            <span className="font-rajdhani font-semibold text-sm text-haze truncate flex-1">
              @{p.username ?? "player"}
            </span>
            <span
              className={`font-space-mono text-[9px] shrink-0 ${
                p.status === "completed" ? "text-success" : p.status === "forfeited" ? "text-danger" : "text-haze-3"
              }`}
            >
              {p.status === "completed" ? "FINISHED" : p.status === "forfeited" ? "DQ" : "PLAYING"}
            </span>
          </div>
        ))}
      </div>

      {/* End arena */}
      <div className="px-5 py-4 border-t border-cosmos-4 shrink-0">
        <Button
          variant="ghost"
          size="md"
          fullWidth
          onClick={handleEndArena}
          disabled={ending}
          loading={ending}
          className="border border-danger/40 text-danger hover:bg-danger/10"
        >
          End Arena Early
        </Button>
      </div>
    </div>
  );
}

/* ─── Disqualified Banner ─── */
function DQBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -40 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-14 inset-x-0 z-40 flex items-center justify-center gap-2 px-4 py-2 bg-danger/90"
    >
      <AlertTriangle size={14} className="text-white" aria-hidden="true" />
      <p className="font-space-mono text-[11px] text-white tracking-widest">
        ANTI-CHEAT · TAB SWITCH DETECTED · DISQUALIFIED
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
  const [hasTimer, setHasTimer] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [timeUp, setTimeUp] = useState(false);

  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [answer, setAnswer] = useState("");

  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [testRan, setTestRan] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [disqualified, setDisqualified] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const prevPlayersRef = useRef<Player[]>([]);
  const activityIdRef = useRef(0);

  /* ─── Fetch room data ─── */
  const fetchRoom = useCallback(async (silent = false) => {
    try {
      const res = await fetchWithAuth(`/api/rooms/${roomId}`);
      if (res.status === 401) {
        router.replace(`/login?next=/arena/${roomId}`);
        return;
      }
      if (!res.ok) return;

      const json = (await res.json()) as RoomData;

      if (json.room.status === "lobby") { router.replace(`/lobby/${roomId}`); return; }
      if (json.room.status === "ended") { router.replace(`/arena/${roomId}/results`); return; }

      // Derive activity feed from player status changes
      if (prevPlayersRef.current.length > 0) {
        const newItems: ActivityItem[] = [];
        for (const player of json.players) {
          const prev = prevPlayersRef.current.find((p) => p.userId === player.userId);
          if (prev && prev.status !== player.status) {
            const name = player.username ?? "Someone";
            if (player.status === "completed") newItems.push({ id: `act-${activityIdRef.current++}`, type: "completed", player: name, text: "submitted a solution" });
            else if (player.status === "forfeited") newItems.push({ id: `act-${activityIdRef.current++}`, type: "forfeited", player: name, text: "was disqualified" });
          } else if (!prev) {
            const name = player.username ?? "Someone";
            newItems.push({ id: `act-${activityIdRef.current++}`, type: "joined", player: name, text: "entered the arena" });
          }
        }
        if (newItems.length > 0) setActivityFeed((prev) => [...newItems, ...prev].slice(0, 20));
      }
      prevPlayersRef.current = json.players;

      if (!silent) {
        setLanguage(json.room.language ?? "javascript");
        setCode((prev) =>
          prev === ""
            ? (json.room.starterCode || getDefaultCode(json.room.category, json.room.language))
            : prev
        );

        const timerSec = json.room.timerSeconds;
        if (timerSec !== null) {
          setHasTimer(true);
          if (json.room.startedAt) {
            const elapsed = Math.floor((Date.now() - new Date(json.room.startedAt).getTime()) / 1000);
            const remaining = Math.max(0, timerSec - elapsed);
            setTimeLeft(remaining);
            if (remaining === 0) setTimeUp(true);
          } else {
            setTimeLeft(timerSec);
          }
        } else {
          setHasTimer(false);
          setTimeLeft(null);
        }
      }

      setData(json);
    } catch {
      // network error, ignore
    } finally {
      if (!silent) setLoading(false);
    }
  }, [roomId, router]);

  useEffect(() => { fetchRoom(false); }, [fetchRoom]);
  useEffect(() => {
    const id = setInterval(() => fetchRoom(true), 3000);
    return () => clearInterval(id);
  }, [fetchRoom]);

  /* ─── Timer countdown — only when timerSeconds was set ─── */
  useEffect(() => {
    if (!hasTimer || timeUp || submitted || disqualified) return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t === null || t <= 1) { clearInterval(id); setTimeUp(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [hasTimer, timeUp, submitted, disqualified]);

  useEffect(() => {
    if (!timeUp) return;
    const t = setTimeout(() => router.replace(`/arena/${roomId}/results`), 3000);
    return () => clearTimeout(t);
  }, [timeUp, router, roomId]);

  /* ─── Keyboard shortcuts ─── */
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (inputDisabled) return;
      if (e.ctrlKey && e.shiftKey && e.key === "Enter") { e.preventDefault(); handleSubmit(); }
      else if (e.ctrlKey && e.key === "Enter") { e.preventDefault(); handleRunTests(); }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  });

  /* ─── Anti-cheat: first tab switch = immediate disqualification ─── */
  const handleStrike = useCallback(
    (_count: number, _reason: string) => {
      setDisqualified(true);
      toast({ type: "error", title: "DISQUALIFIED", message: "Tab switch detected. You have been removed from this arena." });
      fetchWithAuth(`/api/rooms/${roomId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: "__forfeit__" }),
      }).catch(() => {});
    },
    [toast, roomId]
  );

  // Anti-cheat disabled for the host — they're the referee, not a competitor
  useArenaGuard({ onStrike: handleStrike, maxStrikes: 1, enabled: !(data?.isAdmin ?? true) });

  /* ─── Derived ─── */
  const inputDisabled = timeUp || disqualified || submitted || loading;

  /* ─── Run tests ─── */
  async function handleRunTests() {
    if (!data || inputDisabled) return;
    setRunning(true);
    setTestRan(false);
    try {
      const res = await fetchWithAuth(`/api/rooms/${roomId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language, runTestsOnly: true }),
      });
      if (!res.ok) { const err = (await res.json()) as { error?: string }; toast({ type: "error", title: "Run failed", message: err.error }); return; }
      const json = (await res.json()) as { testResults: { passed: number; total: number; results: TestResult[] }; runOnly: boolean };
      setTestResults(json.testResults.results);
      setTestRan(true);
      const { passed, total } = json.testResults;
      toast({ type: passed === total && total > 0 ? "success" : "warning", title: `${passed}/${total} public tests passed` });
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
      const res = await fetchWithAuth(`/api/rooms/${roomId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isCoding ? { code, language } : { answer }),
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
      };

      if (json.won) {
        setSubmitted(true);
        toast({ type: "coins", title: "YOU WON! 🏆", message: "Redirecting to results...", duration: 2000 });
        setTimeout(() => router.replace(`/arena/${roomId}/results`), 2000);
      } else if (isCoding && json.testResults) {
        setSubmitted(true);
        const { passed, total } = json.testResults;
        setTestResults(json.testResults.results);
        setTestRan(true);
        const pct = total > 0 ? Math.round((passed / total) * 100) : 0;
        toast({
          type: passed === 0 ? "error" : "info",
          title: passed === 0 ? "All tests failed" : `${pct}% tests passed`,
          message: passed === 0 ? "You have been disqualified." : `${passed}/${total} hidden tests passed`,
        });
        if (passed === 0) setDisqualified(true);
      } else {
        // Non-coding: allow retries on wrong answer
        const correct = json.correct ?? false;
        if (correct) {
          setSubmitted(true);
          toast({ type: "success", title: "Correct! But someone was faster." });
        } else {
          toast({ type: "error", title: "Wrong answer — try again." });
        }
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
          <p className="font-space-mono text-xs text-haze-3 tracking-widest">LOADING ARENA...</p>
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
    <div className="min-h-[100dvh] flex flex-col bg-cosmos select-none" onContextMenu={(e) => e.preventDefault()}>
      <AnimatePresence>{disqualified && <DQBanner />}</AnimatePresence>
      <AnimatePresence>{timeUp && <TimeUpBanner />}</AnimatePresence>

      {/* ── Top bar ── */}
      <div className="fixed top-0 inset-x-0 z-30 flex items-center justify-between gap-2 px-4 md:px-6 h-14 bg-cosmos-2 border-b border-cosmos-4">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <span className="font-rajdhani font-bold text-sm text-haze truncate max-w-[120px] sm:max-w-[180px]">{room.name}</span>
          {room.category && (
            <span className="hidden sm:inline-block font-space-mono text-[10px] px-2 py-0.5 border shrink-0" style={{ color: catColor, borderColor: `${catColor}40`, backgroundColor: `${catColor}15` }}>
              {room.category.toUpperCase()}
            </span>
          )}
          {room.difficulty && (
            <Chip color={DIFF_CHIP_COLOR[room.difficulty]} size="xs" className="hidden md:inline-flex shrink-0">
              {room.difficulty.toUpperCase()}
            </Chip>
          )}
        </div>

        {/* Timer — only shown when the room was created with a timer */}
        {hasTimer && timeLeft !== null
          ? <Timer seconds={timeLeft} />
          : <span className="font-space-mono text-[10px] text-haze-3 tracking-widest shrink-0">NO TIMER</span>
        }

        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
          <Users size={14} className="text-haze-3" aria-hidden="true" />
          <span className="font-space-mono text-xs text-haze-3">{players.filter(p => p.userId !== room.adminId).length}/{room.playerCap}</span>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex flex-col lg:flex-row flex-1 pt-14 lg:h-[calc(100dvh-56px)]">

        {/* Challenge panel */}
        {(isCoding || data.isAdmin) && (
          <div className="w-full lg:w-[28%] lg:max-w-[300px] border-b lg:border-b-0 lg:border-r border-cosmos-4 flex flex-col bg-cosmos-2 overflow-y-auto shrink-0">
            {/* Header */}
            <div className="px-5 pt-4 pb-3 border-b border-cosmos-4 bg-cosmos-3 shrink-0">
              <p className="font-space-mono text-[9px] text-void tracking-[3px] uppercase mb-1">Challenge Brief</p>
              <p className="font-zen-dots text-sm text-haze leading-snug truncate">{room.name}</p>
            </div>

            {/* Task */}
            <div className="px-5 py-4 flex-1 overflow-y-auto">
              <div className="p-4 mb-4 border-l-2 bg-cosmos" style={{ borderLeftColor: catColor }}>
                <p className="font-rajdhani text-sm text-haze leading-relaxed whitespace-pre-wrap">
                  {room.taskNormalised ?? room.taskRaw}
                </p>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-5">
                {room.category && (
                  <span className="font-space-mono text-[9px] px-2 py-0.5 border" style={{ color: catColor, borderColor: `${catColor}40`, backgroundColor: `${catColor}15` }}>
                    {room.category.toUpperCase()}
                  </span>
                )}
                {room.difficulty && (
                  <Chip color={DIFF_CHIP_COLOR[room.difficulty]} size="xs">{room.difficulty.toUpperCase()}</Chip>
                )}
                <Chip color="crown" size="xs">{room.bountyTier.toUpperCase()}</Chip>
              </div>

              {/* Players */}
              <div className="border border-cosmos-4 bg-cosmos-3 p-3">
                <p className="font-space-mono text-[9px] text-haze-3 tracking-widest mb-2 uppercase">Players</p>
                {players.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 py-1 border-b border-cosmos-4/40 last:border-0">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${p.status === "completed" ? "bg-success" : p.status === "forfeited" ? "bg-danger" : "bg-haze-3"}`} />
                    <span className="font-space-mono text-[9px] text-haze-2 truncate flex-1">@{p.username ?? "player"}</span>
                    <span className={`font-space-mono text-[9px] shrink-0 ${p.status === "completed" ? "text-success" : p.status === "forfeited" ? "text-danger" : "text-haze-3"}`}>
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Editor + results (or host panel) */}
        <div className="flex-1 flex flex-col lg:flex-row min-w-0 overflow-hidden">
          <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-cosmos-4 min-h-[400px] lg:min-h-0 bg-[#06040c]">
            {data.isAdmin ? (
              <HostPanel
                players={players}
                adminId={room.adminId}
                roomId={roomId}
                onEnded={() => router.replace("/dashboard")}
              />
            ) : isCoding ? (
              <CodeEditor
                code={code} setCode={setCode}
                language={language}
                onRun={handleRunTests} onSubmit={handleSubmit}
                disabled={inputDisabled} running={running} submitting={submitting}
              />
            ) : (
              /* Beautiful centered non-coding Question & Answer layout */
              <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-8 overflow-y-auto w-full">
                <div className="w-full max-w-xl bg-cosmos-2 border border-cosmos-4 p-6 md:p-8 rounded-xl shadow-xl flex flex-col gap-6">
                  {/* Question header */}
                  <div className="flex items-center justify-between border-b border-cosmos-4 pb-4">
                    <span className="font-space-mono text-[10px] text-void uppercase tracking-widest">
                      Question
                    </span>
                    {room.category && (
                      <span
                        className="font-space-mono text-[9px] px-2 py-0.5 border"
                        style={{
                          color: catColor,
                          borderColor: `${catColor}40`,
                          backgroundColor: `${catColor}15`,
                        }}
                      >
                        {room.category.toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* The Question Text */}
                  <div className="py-2">
                    <p className="font-rajdhani font-semibold text-lg md:text-xl text-haze leading-relaxed whitespace-pre-wrap">
                      {room.taskNormalised ?? room.taskRaw}
                    </p>
                  </div>

                  {/* Answer input */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="user-answer" className="font-space-mono text-[9px] text-haze-3 uppercase tracking-widest">
                      Your Answer
                    </label>
                    <textarea
                      id="user-answer"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      onKeyDown={(e) => {
                        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                          e.preventDefault();
                          handleSubmit();
                        }
                      }}
                      className="w-full p-4 bg-cosmos border border-cosmos-4 text-haze font-rajdhani text-base focus:outline-none focus:border-void resize-none rounded-lg"
                      placeholder="Type your answer here..."
                      disabled={inputDisabled}
                      rows={3}
                    />
                    <p className="font-space-mono text-[9px] text-haze-3 text-right">
                      Case-insensitive · Ctrl+Enter to submit
                    </p>
                  </div>

                  {/* Submit button */}
                  <div className="flex justify-end pt-4 border-t border-cosmos-4">
                    <Button
                      variant="primary"
                      size="md"
                      onClick={handleSubmit}
                      disabled={inputDisabled || submitting}
                      loading={submitting}
                      className="gap-2"
                    >
                      <Upload size={14} aria-hidden="true" /> SUBMIT ANSWER
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right panel */}
          <div className="w-full lg:w-64 xl:w-80 flex flex-col shrink-0 bg-cosmos-2">
            {!isCoding && (
              <div className="p-4 border-b border-cosmos-4">
                <div className="bg-cosmos-3 border border-cosmos-4 p-4">
                  <p className="font-space-mono text-[9px] text-void tracking-widest mb-3 uppercase">Players</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {players.map((p) => (
                      <div key={p.id} className="flex items-center gap-2 py-1.5 border-b border-cosmos-4/30 last:border-0">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${p.status === "completed" ? "bg-success" : p.status === "forfeited" ? "bg-danger" : "bg-haze-3"}`} />
                        <span className="font-space-mono text-[10px] text-haze-2 truncate flex-1">@{p.username ?? "player"}</span>
                        <span className={`font-space-mono text-[9px] uppercase tracking-wider shrink-0 ${p.status === "completed" ? "text-success" : p.status === "forfeited" ? "text-danger" : "text-haze-3"}`}>
                          {p.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {isCoding && (
              <div className="flex-1 p-4 overflow-y-auto border-b border-cosmos-4">
                <TestResults testCases={testCases} results={testResults} ran={testRan} />
              </div>
            )}
            <div className={isCoding ? "p-4" : "flex-1 p-4"}>
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
            className="fixed bottom-6 inset-x-6 z-40 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-danger/10 border border-danger/50 px-6 py-4 text-center clip-arena-sm">
              <p className="font-zen-dots text-danger text-sm">DISQUALIFIED</p>
              <p className="font-space-mono text-[10px] text-haze-3 mt-1">You have been removed from this arena.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
