"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Upload, Users, AlertTriangle, Crown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { arenaCheatMessage, useArenaGuard, type ArenaCheatReason } from "@/hooks/useArenaGuard";
import { useToast } from "@/components/ui/Toast";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { readApiError } from "@/lib/readApiError";
import { getLanguage } from "@/lib/languages";
import { getChallengePromptText } from "@/lib/roomQuestions";

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
  questions?: {
    index: number;
    taskNormalised: string;
    taskRaw: string;
    category?: string;
    canonicalAnswer?: string | null;
    language?: string | null;
    starterCode?: string | null;
    title?: string;
    publicTests?: { input: string; expectedOutput: string }[];
  }[];
  totalQuestions?: number;
  progress?: {
    answeredQuestionIndices: number[];
    nextQuestionIndex: number | null;
    allQuestionsAnswered: boolean;
  };
  mySubmission: { id: string; isWinner: boolean; testsPassed: number; testsTotal: number } | null;
  isAdmin: boolean;
  timer?: {
    hasTimer: boolean;
    totalSeconds: number | null;
    remainingSeconds: number | null;
    serverNow: string;
    expired: boolean;
  };
}

function syncArenaTimer(
  timer: RoomData["timer"] | undefined,
  setHasTimer: (value: boolean) => void,
  setTimeLeft: (value: number | null) => void,
  setTimeUp: (value: boolean) => void,
) {
  if (!timer?.hasTimer) {
    setHasTimer(false);
    setTimeLeft(null);
    setTimeUp(false);
    return;
  }

  const remaining = Math.max(0, timer.remainingSeconds ?? 0);
  setHasTimer(true);
  setTimeLeft(remaining);
  setTimeUp(timer.expired || remaining <= 0);
}

interface TestResult {
  pass: boolean;
  output: string;
}

/* ─── Constants ─── */
const CAT_COLORS: Record<string, string> = {
  coding:  "#7C5CFF",
  trivia:  "#A78BFA",
  logic:   "#22D3EE",
  math:    "#F0A500",
  writing: "#F472B6",
  design:  "#34D399",
  meme:    "#FB7185",
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

function getPublicTestCases(
  roomId: string,
  dbCases: TestCase[],
  question?: { index?: number; publicTests?: { input: string; expectedOutput: string }[] },
): TestCase[] {
  if (question?.publicTests?.length) {
    return question.publicTests.map((t, i) => ({
      id: `pub-${question.index ?? i}`,
      roomId,
      input: t.input,
      expectedOutput: t.expectedOutput,
      isHidden: false,
      isActive: true,
    }));
  }
  return dbCases.filter((t) => !t.isHidden);
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
    <div className="rounded-xl bg-[var(--surface-inset)] border border-[var(--border-1)] p-4 h-full">
      <p className="font-mono text-[10px] text-[var(--brand-primary)] tracking-widest mb-4 uppercase">
        Arena Activity
      </p>
      <AnimatePresence initial={false}>
        {items.length === 0 && (
          <p className="font-mono text-[10px] text-haze-3">Waiting for activity...</p>
        )}
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 mb-3"
          >
            <span
              className={`font-mono text-[10px] shrink-0 ${
                item.type === "completed" ? "text-success" : item.type === "forfeited" ? "text-danger" : "text-haze-3"
              }`}
            >
              {item.type === "completed" ? "✓" : item.type === "forfeited" ? "✗" : "●"}
            </span>
            <p className="font-mono text-[10px] text-haze-2 leading-relaxed">
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
    <div className="rounded-xl bg-[var(--surface-inset)] border border-[var(--border-1)] p-4">
      <p className="font-mono text-[10px] text-[var(--brand-primary)] tracking-widest mb-4 uppercase">
        Test Results
      </p>
      {!ran && testCases.length === 0 && (
        <p className="font-mono text-[10px] text-haze-3">Run tests to see results</p>
      )}
      {testCases.map((tc, i) => {
        const result = results[i];
        const status = !ran ? "pending" : result?.pass ? "pass" : "fail";
        return (
          <div key={tc.id} className="py-2 border-b border-[var(--border-1)] last:border-0">
            <div className="flex items-center gap-3 mb-1">
              <span className={`font-mono text-xs w-4 text-center ${status === "pass" ? "text-success" : status === "fail" ? "text-danger" : "text-haze-3"}`} aria-label={status}>
                {status === "pass" ? "✓" : status === "fail" ? "✗" : "○"}
              </span>
              <div className="flex-1 font-mono text-[10px] text-haze-2 min-w-0">
                <span className="text-haze-3">in:</span>{" "}
                <span className="text-haze truncate">{tc.input}</span>
              </div>
            </div>
            {ran && result && (
              <div className="pl-7 font-mono text-[9px] text-haze-3 space-y-0.5">
                <div><span className="text-haze-3">expected:</span> <span className="text-success">{tc.expectedOutput}</span></div>
                <div><span className="text-haze-3">got:</span> <span className={result.pass ? "text-success" : "text-danger"}>{result.output || "(empty)"}</span></div>
              </div>
            )}
          </div>
        );
      })}
      {ran && <p className="font-mono text-[10px] text-haze-3 mt-3">Submit to run against hidden tests</p>}
    </div>
  );
}

/* ─── Challenge prompt (coding + shared) ─── */
function ChallengePromptCard({
  prompt,
  questionCategory,
  catColor,
  questionIndex,
  totalQuestions,
}: {
  prompt: string;
  questionCategory: RoomCategory;
  catColor: string;
  questionIndex: number;
  totalQuestions: number;
}) {
  return (
    <div
      className="border-b shrink-0 px-5 py-5 md:px-6 md:py-6"
      style={{ background: "var(--surface-raised)", borderColor: "var(--border-1)" }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="font-mono text-[10px] text-[var(--brand-primary)] tracking-[3px] uppercase">
          Challenge
        </p>
        {questionCategory && (
          <span
            className="font-mono text-[10px] px-2 py-0.5 border rounded tracking-wider shrink-0"
            style={{ color: catColor, borderColor: `${catColor}55`, backgroundColor: `${catColor}14` }}
          >
            {questionCategory.toUpperCase()}
          </span>
        )}
      </div>
      <p className="font-body text-base md:text-lg lg:text-xl text-haze leading-relaxed whitespace-pre-wrap">
        {prompt}
      </p>
      {totalQuestions > 1 && (
        <p className="font-mono text-[10px] text-[var(--brand-primary)] mt-3 tracking-widest uppercase">
          Question {questionIndex + 1} of {totalQuestions}
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
  onRun: () => void;
  onSubmit: () => void;
  disabled: boolean;
  running: boolean;
  submitting: boolean;
}

function CodeEditor({
  code,
  setCode,
  language,
  onRun,
  onSubmit,
  disabled,
  running,
  submitting,
  onPaste,
  onCopy,
  onBeforeInput,
  onDrop,
}: CodeEditorProps & {
  onPaste: (e: React.ClipboardEvent) => void;
  onCopy: (e: React.ClipboardEvent) => void;
  onBeforeInput: (e: React.FormEvent<HTMLTextAreaElement>) => void;
  onDrop: (e: React.DragEvent) => void;
}) {
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
    <div className="bx-native-cursor flex flex-col h-full">
      {/* IDE-style tab bar with the locked, AI-analysed language */}
      <div className="flex items-center justify-between border-b border-[var(--terminal-border)] bg-[var(--surface-raised)] px-4">
        <div className="flex items-center gap-2 py-2.5">
          <span className="w-2 h-2 rounded-full" style={{ background: "var(--brand-primary)" }} aria-hidden />
          <span className="font-mono text-xs text-haze">solution.{spec.ext}</span>
        </div>
        <span
          className="font-mono text-[10px] px-2 py-1 my-1.5 border rounded text-[var(--brand-primary)]"
          style={{ borderColor: "var(--border-accent)", background: "var(--void-tint)" }}
          title="Language set by the AI from the challenge"
        >
          {spec.label}
        </span>
      </div>

      {/* Gutter + textarea */}
      <div className="flex-1 flex overflow-hidden min-h-[280px]" style={{ background: "var(--terminal-bg)" }}>
        <div
          aria-hidden
          className="select-none py-4 pl-3 pr-2 text-right font-mono text-xs leading-relaxed text-haze-3/50 border-r"
          style={{ background: "var(--surface-inset)", borderColor: "var(--terminal-border)" }}
        >
          {Array.from({ length: lineCount }).map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={handleKey}
          className="bx-native-cursor flex-1 p-4 bg-transparent text-haze font-mono text-sm resize-none focus:outline-none leading-relaxed select-text"
          style={{ caretColor: "var(--brand-primary)" }}
          spellCheck={false}
          aria-label="Code editor"
          disabled={disabled}
          onPaste={onPaste}
          onCopy={onCopy}
          onBeforeInput={onBeforeInput}
          onDrop={onDrop}
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>

      <div className="flex items-center justify-between gap-2 px-4 py-3 bg-[var(--surface-raised)] border-t border-[var(--terminal-border)]">
        <p className="hidden sm:block font-mono text-[10px] text-haze-3">Ctrl+Enter run · Ctrl+Shift+Enter submit</p>
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

function AnswerInput({ answer, setAnswer, onSubmit, disabled, submitting, onPaste }: AnswerInputProps & { onPaste: (e: React.ClipboardEvent) => void }) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-4 pb-3 border-b border-[var(--border-1)] bg-[var(--surface-raised)] shrink-0">
        <p className="font-mono text-[11px] text-[var(--brand-primary)] tracking-[3px] uppercase">Your Answer</p>
        <p className="font-body text-xs text-haze-3 mt-1">Stay on this page · paste is disabled · Ctrl+Enter to submit</p>
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
        onPaste={onPaste}
        onCopy={(e) => e.preventDefault()}
        className="flex-1 p-5 text-haze font-body text-lg placeholder:text-haze-3/60 focus:outline-none resize-none"
        style={{ background: "var(--terminal-bg)", caretColor: "var(--brand-primary)" }}
        placeholder="Type your answer here..."
        disabled={disabled}
        aria-label="Answer input"
      />
      <div className="flex items-center justify-end px-5 py-3 bg-[var(--surface-raised)] border-t border-[var(--border-1)] shrink-0">
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
    <div className="flex flex-col h-full bg-[var(--surface-raised)]">
      {/* Host badge */}
      <div
        className="px-6 pt-5 pb-4 border-b shrink-0 flex items-center gap-4"
        style={{ background: "var(--surface-inset)", borderColor: "var(--border-1)" }}
      >
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "rgba(240,165,0,0.14)", border: "1px solid rgba(240,165,0,0.35)" }}
        >
          <Crown size={16} className="text-crown" aria-hidden="true" />
        </div>
        <div>
          <p className="font-mono text-[11px] text-crown tracking-[2px] uppercase">Host View</p>
          <p className="font-body text-sm text-haze-2">You created this arena — you cannot compete</p>
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="px-6 py-4 border-b shrink-0"
        style={{ background: "var(--surface-inset)", borderColor: "var(--border-1)" }}
      >
        <div className="flex justify-between items-center mb-2">
          <p className="font-mono text-[10px] text-haze-3 uppercase tracking-widest">Competitors finished</p>
          <p className="font-stats font-bold text-base text-haze tabular-nums">{done}/{total}</p>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border-1)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: total > 0 ? `${(done / total) * 100}%` : "0%",
              background: "var(--brand-primary)",
              boxShadow: "0 0 12px var(--glow-1)",
            }}
          />
        </div>
      </div>

      {/* Competitors list */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <p className="font-mono text-[10px] text-haze-3 tracking-widest mb-4 uppercase">Live standings</p>
        {competitors.length === 0 && (
          <p className="font-body text-sm text-haze-3">No competitors have joined yet.</p>
        )}
        {competitors.map((p, i) => (
          <div
            key={p.id}
            className="flex items-center gap-3 py-3 border-b last:border-0"
            style={{ borderColor: "var(--border-1)" }}
          >
            <span className="font-stats text-xs text-haze-3 w-5 shrink-0">{i + 1}</span>
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                p.status === "completed" ? "bg-success" : p.status === "forfeited" ? "bg-danger" : "bg-haze-3"
              }`}
            />
            <span className="font-body font-semibold text-sm text-haze truncate flex-1">
              @{p.username ?? "player"}
            </span>
            <span
              className={`font-mono text-[10px] shrink-0 tracking-wider ${
                p.status === "completed" ? "text-success" : p.status === "forfeited" ? "text-danger" : "text-haze-3"
              }`}
            >
              {p.status === "completed" ? "FINISHED" : p.status === "forfeited" ? "DQ" : "PLAYING"}
            </span>
          </div>
        ))}
      </div>

      {/* End arena */}
      <div className="px-6 py-5 border-t shrink-0" style={{ borderColor: "var(--border-1)" }}>
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
function DQBanner({ reason }: { reason: ArenaCheatReason }) {
  const labelMap: Record<ArenaCheatReason, string> = {
    "tab-switch": "LEFT ARENA TAB · DISQUALIFIED",
    "split-view": "SPLIT VIEW DETECTED · DISQUALIFIED",
    "external-input": "EXTERNAL TEXT BLOCKED · DISQUALIFIED",
    "side-panel": "EXTERNAL PANEL DETECTED · DISQUALIFIED",
    "window-blur": "FOCUS LEFT ARENA · DISQUALIFIED",
    "devtools": "DEVTOOLS OPENED · DISQUALIFIED",
    "new-window": "SECOND ARENA WINDOW · DISQUALIFIED",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -40 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-14 inset-x-0 z-40 flex items-center justify-center gap-2 px-4 py-2"
      style={{ background: "var(--danger)" }}
    >
      <AlertTriangle size={14} className="text-white" aria-hidden="true" />
      <p className="font-mono text-[11px] text-white tracking-widest">
        ANTI-CHEAT · {labelMap[reason]}
      </p>
    </motion.div>
  );
}

function IntegrityWarningBanner({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-14 inset-x-0 z-30 flex items-center justify-center gap-2 px-4 py-2 bg-crown/90"
    >
      <AlertTriangle size={14} className="text-cosmos shrink-0" aria-hidden="true" />
      <p className="font-space-mono text-[10px] text-cosmos tracking-wide text-center">{message}</p>
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
  const [tabDisqualified, setTabDisqualified] = useState(false);
  const [cheatReason, setCheatReason] = useState<ArenaCheatReason>("tab-switch");
  const [integrityWarning, setIntegrityWarning] = useState<string | null>(null);
  const [arenaComplete, setArenaComplete] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);

  const prevPlayersRef = useRef<Player[]>([]);
  const activityIdRef = useRef(0);

  useEffect(() => {
    setData(null);
    setLoading(true);
    setHasTimer(false);
    setTimeLeft(null);
    setTimeUp(false);
    setArenaComplete(false);
    setTabDisqualified(false);
    setTestResults([]);
    setTestRan(false);
    setQuestionIndex(0);
    setQuestionsAnswered(0);
    prevPlayersRef.current = [];
  }, [roomId]);

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
      if (json.room.status === "ended" || json.room.status === "cancelled") {
        router.replace(`/arena/${roomId}/results`);
        return;
      }

      syncArenaTimer(json.timer, setHasTimer, setTimeLeft, setTimeUp);

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
        const resumeIndex = json.progress?.nextQuestionIndex ?? 0;
        setQuestionIndex(resumeIndex);
        setQuestionsAnswered(json.progress?.answeredQuestionIndices.length ?? 0);
        if (json.progress?.allQuestionsAnswered) {
          setArenaComplete(true);
        }

        const activeQ = json.questions?.[resumeIndex];
        const initCategory = (activeQ?.category ?? json.room.category) as RoomCategory;
        setLanguage(activeQ?.language ?? json.room.language ?? "javascript");
        setCode(
          activeQ?.starterCode ??
            json.room.starterCode ??
            getDefaultCode(initCategory, activeQ?.language ?? json.room.language),
        );
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

  /* ─── Timer countdown — synced from server, ticks locally between polls ─── */
  useEffect(() => {
    if (!hasTimer || timeUp || tabDisqualified || timeLeft == null || timeLeft <= 0) {
      return;
    }

    const id = setInterval(() => {
      setTimeLeft((current) => {
        if (current == null || current <= 1) {
          setTimeUp(true);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [hasTimer, timeUp, tabDisqualified, timeLeft]);

  useEffect(() => {
    if (!timeUp || !hasTimer) return;

    fetchWithAuth(`/api/rooms/${roomId}/submit`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "finalize" }),
    }).catch(() => {});

    const t = setTimeout(() => router.replace(`/arena/${roomId}/results`), 3000);
    return () => clearTimeout(t);
  }, [timeUp, hasTimer, router, roomId]);

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

  /* ─── Anti-cheat: tab switch or external side panel = disqualification ─── */
  const handleStrike = useCallback(
    (_count: number, reason: ArenaCheatReason) => {
      setCheatReason(reason);
      setTabDisqualified(true);
      toast({
        type: "error",
        title: "Disqualified",
        message: `${arenaCheatMessage(reason)} You have been removed from this arena.`,
      });
      fetchWithAuth(`/api/rooms/${roomId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: "__forfeit__" }),
      }).catch(() => {});
    },
    [toast, roomId]
  );

  const handleIntegrityWarning = useCallback(
    (
      _kind: "split-view" | "side-panel" | "window-blur" | "devtools" | null,
      message: string | null,
    ) => {
      setIntegrityWarning(message);
    },
    [],
  );

  const { blockPaste, blockBeforeInput, blockContextMenu, blockDrop, blockCopy } = useArenaGuard({
    onStrike: handleStrike,
    onWarning: handleIntegrityWarning,
    maxStrikes: 1,
    enabled: !(data?.isAdmin ?? true),
  });

  /* ─── Derived ─── */
  const inputDisabled = timeUp || tabDisqualified || arenaComplete || loading;
  const totalQuestions = data?.totalQuestions ?? data?.questions?.length ?? 1;
  const currentQuestion = data?.questions?.[questionIndex];
  const questionCategory = (currentQuestion?.category ?? data?.room.category ?? "trivia") as RoomCategory;
  const isCoding = questionCategory === "coding";
  const challengePrompt = data
    ? getChallengePromptText(currentQuestion, data.room)
    : "";
  const activeTestCases = data
    ? getPublicTestCases(roomId, data.testCases, currentQuestion)
    : [];

  const prevQuestionIndexRef = useRef(-1);

  /* Reset answer/editor state when advancing to a new question */
  useEffect(() => {
    if (!data) return;
    if (prevQuestionIndexRef.current === questionIndex) return;
    prevQuestionIndexRef.current = questionIndex;

    const q = data.questions?.[questionIndex];
    const cat = (q?.category ?? data.room.category) as RoomCategory;
    setAnswer("");
    setTestResults([]);
    setTestRan(false);
    if (cat === "coding") {
      setLanguage(q?.language ?? data.room.language ?? "javascript");
      setCode(
        q?.starterCode ??
          data.room.starterCode ??
          getDefaultCode(cat, q?.language ?? data.room.language)
      );
    }
  }, [questionIndex, data]);

  /* ─── Run tests ─── */
  async function handleRunTests() {
    if (!data || inputDisabled) return;
    setRunning(true);
    setTestRan(false);
    try {
      const res = await fetchWithAuth(`/api/rooms/${roomId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language, runTestsOnly: true, questionIndex }),
      });
      if (!res.ok) {
        toast({ type: "error", title: "Run failed", message: await readApiError(res) });
        return;
      }
      const json = (await res.json()) as { testResults: { passed: number; total: number; results: TestResult[] }; runOnly: boolean };
      setTestResults(json.testResults.results);
      setTestRan(true);
      const { passed, total } = json.testResults;
      toast({ type: passed === total && total > 0 ? "success" : "warning", title: `${passed}/${total} public tests passed` });
    } catch {
      toast({ type: "error", title: "Connection problem", message: "We couldn't reach the server. Try again." });
    } finally {
      setRunning(false);
    }
  }

  /* ─── Submit ─── */
  async function handleSubmit() {
    if (!data || inputDisabled) return;
    setSubmitting(true);
    try {
      const isCodingSubmit = (currentQuestion?.category ?? data.room.category) === "coding";
      const res = await fetchWithAuth(`/api/rooms/${roomId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isCodingSubmit ? { code, language, questionIndex } : { answer, questionIndex }),
      });

      if (!res.ok) {
        toast({ type: "error", title: "Submission failed", message: await readApiError(res) });
        return;
      }

      const json = (await res.json()) as {
        won?: boolean;
        correct?: boolean;
        accepted?: boolean;
        verdict?: "correct" | "close_enough" | "incorrect";
        feedback?: string;
        testResults?: { passed: number; total: number; results: TestResult[] };
        nextQuestionIndex?: number | null;
        questionsAnswered?: number;
        totalQuestions?: number;
      };

      if (json.won) {
        setArenaComplete(true);
        toast({ type: "coins", title: "YOU WON! 🏆", message: "Redirecting to results...", duration: 2000 });
        setTimeout(() => router.replace(`/arena/${roomId}/results`), 2000);
        return;
      }

      if (json.nextQuestionIndex != null) {
        setQuestionIndex(json.nextQuestionIndex);
        setAnswer("");
        setArenaComplete(false);
        setQuestionsAnswered(json.questionsAnswered ?? questionIndex + 1);
        const closeEnough = json.verdict === "close_enough";
        const isCodingAdvance = isCodingSubmit && json.testResults;
        toast({
          type: "success",
          title: closeEnough
            ? "Close enough!"
            : isCodingAdvance
              ? `Question ${json.questionsAnswered} submitted`
              : `Question ${json.questionsAnswered} correct!`,
          message:
            json.feedback ??
            (isCodingAdvance
              ? "Moving to the next question..."
              : "Moving to the next question..."),
        });
        return;
      }

      const allDone =
        (json.questionsAnswered ?? 0) >= totalQuestions ||
        (totalQuestions === 1 && (json.correct || isCodingSubmit));

      if (allDone) {
        setArenaComplete(true);
        if (isCodingSubmit && json.testResults) {
          const { passed, total } = json.testResults;
          setTestResults(json.testResults.results);
          setTestRan(true);
          const pct = total > 0 ? Math.round((passed / total) * 100) : 0;
          toast({
            type: passed === 0 ? "error" : "info",
            title: passed === 0 ? "All tests failed" : `${pct}% tests passed`,
            message:
              totalQuestions > 1
                ? "All questions answered — waiting for other players..."
                : passed === 0
                  ? "Submission recorded."
                  : `${passed}/${total} hidden tests passed`,
          });
        } else {
          const closeEnough = json.verdict === "close_enough";
          toast({
            type: "success",
            title: closeEnough ? "Close enough — you got it!" : "Correct!",
            message:
              json.feedback ??
              (totalQuestions > 1
                ? "All questions answered — waiting for other players..."
                : "But someone was faster."),
          });
        }
        return;
      }

      if (isCodingSubmit && json.testResults) {
        setArenaComplete(true);
        const { passed, total } = json.testResults;
        setTestResults(json.testResults.results);
        setTestRan(true);
        const pct = total > 0 ? Math.round((passed / total) * 100) : 0;
        toast({
          type: passed === 0 ? "error" : "info",
          title: passed === 0 ? "All tests failed" : `${pct}% tests passed`,
          message: passed === 0 ? "Submission recorded." : `${passed}/${total} hidden tests passed`,
        });
        return;
      }

      const correct = json.correct ?? false;
      const closeEnough = json.verdict === "close_enough";
      if (correct) {
        setArenaComplete(true);
        toast({
          type: "success",
          title: closeEnough ? "Close enough — you got it!" : "Correct!",
          message: json.feedback ?? "But someone was faster.",
        });
      } else {
        toast({
          type: "error",
          title: "Not quite — try again",
          message: json.feedback ?? "Your answer wasn't close enough. Give it another shot.",
        });
      }
    } catch {
      toast({ type: "error", title: "Connection problem", message: "We couldn't reach the server. Try again." });
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
          <p className="font-mono text-xs text-haze-3 tracking-widest">LOADING ARENA…</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-cosmos flex items-center justify-center">
        <p className="font-body text-base text-danger">Room not found or access denied.</p>
      </div>
    );
  }

  const { room, players, testCases } = data;
  const catColor = CAT_COLORS[questionCategory] ?? "#7C5CFF";

  return (
    <div className="min-h-[100dvh] flex flex-col bg-cosmos" onContextMenu={blockContextMenu}>
      <AnimatePresence>
        {integrityWarning && !tabDisqualified && (
          <IntegrityWarningBanner key="integrity-warning" message={integrityWarning} />
        )}
      </AnimatePresence>
      <AnimatePresence>{tabDisqualified && <DQBanner reason={cheatReason} />}</AnimatePresence>
      <AnimatePresence>{timeUp && <TimeUpBanner />}</AnimatePresence>

      {/* ── Top bar ── */}
      <div
        className="fixed top-0 inset-x-0 z-30 flex items-center justify-between gap-3 px-4 md:px-6 h-14 border-b"
        style={{ background: "var(--surface-raised)", borderColor: "var(--border-1)" }}
      >
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <span className="font-display text-sm md:text-base text-haze truncate max-w-[140px] sm:max-w-[220px]">{room.name}</span>
          {questionCategory && (
            <span
              className="hidden sm:inline-block font-mono text-[10px] px-2 py-0.5 border rounded shrink-0 tracking-wider"
              style={{ color: catColor, borderColor: `${catColor}55`, backgroundColor: `${catColor}14` }}
            >
              {questionCategory.toUpperCase()}
            </span>
          )}
          {room.difficulty && (
            <Chip color={DIFF_CHIP_COLOR[room.difficulty]} size="xs" className="hidden md:inline-flex shrink-0">
              {room.difficulty.toUpperCase()}
            </Chip>
          )}
        </div>

        {hasTimer && timeLeft !== null
          ? <Timer seconds={timeLeft} />
          : <span className="font-mono text-[10px] text-haze-3 tracking-widest shrink-0">NO TIMER</span>
        }

        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
          <Users size={14} className="text-haze-3" aria-hidden="true" />
          <span className="font-mono text-xs text-haze-3 tabular-nums">
            {players.filter(p => p.userId !== room.adminId).length}/{room.playerCap}
          </span>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex flex-col md:flex-row flex-1 pt-14 lg:h-[calc(100dvh-56px)] min-h-0">

        {/* Challenge panel — always visible beside the IDE when coding (competitors) */}
        {isCoding && !data.isAdmin && (
          <div
            className="flex w-full md:w-[32%] lg:w-[28%] lg:max-w-[340px] border-b md:border-b-0 md:border-r flex-col overflow-y-auto shrink-0 max-h-[38vh] md:max-h-none"
            style={{ background: "var(--surface-raised)", borderColor: "var(--border-1)" }}
          >
            <div
              className="px-6 pt-5 pb-4 border-b shrink-0"
              style={{ background: "var(--surface-inset)", borderColor: "var(--border-1)" }}
            >
              <p className="font-mono text-[10px] text-[var(--brand-primary)] tracking-[3px] uppercase mb-1.5">Arena</p>
              <p className="font-display text-base md:text-lg text-haze leading-snug">{room.name}</p>
            </div>

            <div className="px-6 py-5 flex-1 overflow-y-auto">
              <div
                className="p-4 mb-5 border-l-2 rounded-r-md"
                style={{ borderLeftColor: catColor, background: "var(--surface-inset)" }}
              >
                <p className="font-mono text-[10px] text-[var(--brand-primary)] tracking-widest uppercase mb-2">
                  Challenge
                </p>
                <p className="font-body text-sm md:text-base text-haze leading-relaxed whitespace-pre-wrap">
                  {challengePrompt}
                </p>
                {totalQuestions > 1 && (
                  <p className="font-mono text-[10px] text-[var(--brand-primary)] mt-3 tracking-widest uppercase">
                    Question {questionIndex + 1} of {totalQuestions}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {questionCategory && (
                  <span
                    className="font-mono text-[10px] px-2.5 py-1 border rounded tracking-wider"
                    style={{ color: catColor, borderColor: `${catColor}55`, backgroundColor: `${catColor}14` }}
                  >
                    {questionCategory.toUpperCase()}
                  </span>
                )}
                {room.difficulty && (
                  <Chip color={DIFF_CHIP_COLOR[room.difficulty]} size="xs">{room.difficulty.toUpperCase()}</Chip>
                )}
                <Chip color="crown" size="xs">{room.bountyTier.toUpperCase()}</Chip>
              </div>

              <div className="rounded-xl border border-[var(--border-1)] bg-[var(--surface-inset)] p-4">
                <p className="font-mono text-[10px] text-haze-3 tracking-widest mb-3 uppercase">Players</p>
                {players.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 py-1.5 border-b border-[var(--border-1)] last:border-0">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${p.status === "completed" ? "bg-success" : p.status === "forfeited" ? "bg-danger" : "bg-haze-3"}`} />
                    <span className="font-mono text-[10px] text-haze-2 truncate flex-1">@{p.username ?? "player"}</span>
                    <span className={`font-mono text-[9px] shrink-0 tracking-wider ${p.status === "completed" ? "text-success" : p.status === "forfeited" ? "text-danger" : "text-haze-3"}`}>
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
          <div
            className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r min-h-[400px] lg:min-h-0"
            style={{ background: "var(--terminal-bg)", borderColor: "var(--border-1)" }}
          >
            {data.isAdmin ? (
              <>
                <ChallengePromptCard
                  prompt={challengePrompt}
                  questionCategory={questionCategory}
                  catColor={catColor}
                  questionIndex={questionIndex}
                  totalQuestions={totalQuestions}
                />
                <div className="flex-1 min-h-0">
                  <HostPanel
                    players={players}
                    adminId={room.adminId}
                    roomId={roomId}
                    onEnded={() => router.replace("/dashboard")}
                  />
                </div>
              </>
            ) : isCoding ? (
              <>
                <div className="md:hidden shrink-0">
                  <ChallengePromptCard
                    prompt={challengePrompt}
                    questionCategory={questionCategory}
                    catColor={catColor}
                    questionIndex={questionIndex}
                    totalQuestions={totalQuestions}
                  />
                </div>
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                  <CodeEditor
                    code={code} setCode={setCode}
                    language={language}
                    onRun={handleRunTests} onSubmit={handleSubmit}
                    disabled={inputDisabled} running={running} submitting={submitting}
                    onPaste={blockPaste}
                    onCopy={blockCopy}
                    onBeforeInput={blockBeforeInput}
                    onDrop={blockDrop}
                  />
                </div>
              </>
            ) : (
              /* Centered non-coding Q&A card */
              <div className="flex-1 flex flex-col justify-center items-center p-5 md:p-10 overflow-y-auto w-full">
                <div
                  className="w-full max-w-2xl rounded-2xl p-6 md:p-9 shadow-lg flex flex-col gap-7"
                  style={{
                    background: "var(--surface-raised)",
                    border: "1px solid var(--border-1)",
                  }}
                >
                  <div className="flex items-center justify-between border-b border-[var(--border-1)] pb-4">
                    <span className="font-mono text-[11px] text-[var(--brand-primary)] uppercase tracking-widest">
                      Question
                    </span>
                    {questionCategory && (
                      <span
                        className="font-mono text-[10px] px-2 py-0.5 border rounded tracking-wider"
                        style={{
                          color: catColor,
                          borderColor: `${catColor}55`,
                          backgroundColor: `${catColor}14`,
                        }}
                      >
                        {questionCategory.toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div>
                    <p className="font-body font-semibold text-lg md:text-xl lg:text-2xl text-haze leading-relaxed whitespace-pre-wrap">
                      {challengePrompt}
                    </p>
                    {totalQuestions > 1 && (
                      <p className="font-mono text-xs text-[var(--brand-primary)] mt-4 tracking-widest">
                        QUESTION {questionIndex + 1} OF {totalQuestions}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <label htmlFor="user-answer" className="font-mono text-[10px] text-haze-3 uppercase tracking-widest">
                      Your Answer
                    </label>
                    <textarea
                      id="user-answer"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit();
                          return;
                        }
                        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                          e.preventDefault();
                          handleSubmit();
                        }
                      }}
                      onPaste={blockPaste}
                      onCopy={blockCopy}
                      onBeforeInput={blockBeforeInput}
                      onDrop={blockDrop}
                      onContextMenu={blockContextMenu}
                      className="bx-native-cursor w-full p-4 md:p-5 bg-[var(--surface-inset)] border border-[var(--border-2)] text-haze font-body text-base md:text-lg focus:outline-none focus:border-[var(--brand-primary)] focus:shadow-[0_0_0_3px_var(--focus-ring)] resize-none rounded-xl transition-all"
                      placeholder="Type your answer here..."
                      disabled={inputDisabled}
                      rows={4}
                    />
                    <p className="font-mono text-[10px] text-haze-3 text-right">
                      Full-width tab only · no split view · Enter to submit
                    </p>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-[var(--border-1)]">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleSubmit}
                      disabled={inputDisabled || submitting}
                      loading={submitting}
                      className="gap-2 min-w-[180px]"
                    >
                      <Upload size={16} aria-hidden="true" /> SUBMIT ANSWER
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right panel */}
          <div
            className="w-full lg:w-72 xl:w-80 flex flex-col shrink-0"
            style={{ background: "var(--surface-raised)" }}
          >
            {!isCoding && (
              <div className="p-4 border-b" style={{ borderColor: "var(--border-1)" }}>
                <div className="rounded-xl bg-[var(--surface-inset)] border border-[var(--border-1)] p-4">
                  <p className="font-mono text-[10px] text-[var(--brand-primary)] tracking-widest mb-3 uppercase">Players</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {players.map((p) => (
                      <div key={p.id} className="flex items-center gap-2 py-1.5 border-b border-[var(--border-1)] last:border-0">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${p.status === "completed" ? "bg-success" : p.status === "forfeited" ? "bg-danger" : "bg-haze-3"}`} />
                        <span className="font-mono text-[10px] text-haze-2 truncate flex-1">@{p.username ?? "player"}</span>
                        <span className={`font-mono text-[9px] uppercase tracking-wider shrink-0 ${p.status === "completed" ? "text-success" : p.status === "forfeited" ? "text-danger" : "text-haze-3"}`}>
                          {p.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {isCoding && (
              <div className="flex-1 p-4 overflow-y-auto border-b" style={{ borderColor: "var(--border-1)" }}>
                <TestResults testCases={activeTestCases} results={testResults} ran={testRan} />
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
        {tabDisqualified && !timeUp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed bottom-6 inset-x-6 z-40 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-danger/10 border border-danger/50 px-7 py-5 text-center rounded-xl backdrop-blur-md">
              <p className="font-display text-danger text-base md:text-lg tracking-wide">DISQUALIFIED</p>
              <p className="font-mono text-[10px] md:text-xs text-haze-2 mt-2 max-w-md">
                {arenaCheatMessage(cheatReason)}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
