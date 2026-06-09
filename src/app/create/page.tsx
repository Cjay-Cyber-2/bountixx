"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Copy, AlertCircle, Plus, Trash2, Loader2, ChevronRight } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

/* ─── Types ─── */
type Category = "coding" | "trivia" | "logic" | "math" | "writing" | "design" | "meme";
type Difficulty = "rookie" | "challenger" | "elite" | "legendary";
type Step = "setup" | "questions" | "review" | "lobby";

interface AIAnalysis {
  valid: boolean;
  invalidReason?: string;
  category: Category;
  title: string;
  difficulty: Difficulty;
  taskNormalised: string;
  starterCode?: string;
  publicTests?: { input: string; expectedOutput: string }[];
  hiddenTests?: { input: string; expectedOutput: string }[];
  canonicalAnswer?: string;
}

interface Question {
  localId: string;
  taskRaw: string;
  status: "idle" | "analyzing" | "done" | "error" | "invalid";
  analysis?: AIAnalysis;
  error?: string;
}

interface CreatedRoom { id: string; name: string; status: string; }

const ENTRY_FEE = 50;

/* ─── Constants ─── */
const CAT_COLORS: Record<string, string> = {
  coding: "#FF6B1A", trivia: "#9B6BFF", logic: "#00D68F",
  math: "#F0A500", writing: "#9B8FC0", design: "#C084FC", meme: "#F472B6",
};
const DIFF_COLORS: Record<Difficulty, string> = {
  rookie: "#00D68F", challenger: "#F0A500", elite: "#9B6BFF", legendary: "#FF2D55",
};

/* ─── Step indicator ─── */
function StepIndicator({ step }: { step: Step }) {
  const steps = [
    { id: "setup", label: "SETUP" },
    { id: "questions", label: "QUESTIONS" },
    { id: "review", label: "REVIEW" },
    { id: "lobby", label: "LAUNCH" },
  ];
  const activeIdx = ["setup", "questions", "review", "lobby"].indexOf(step);
  return (
    <div className="flex items-center gap-0 mb-12">
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
              i < activeIdx ? "bg-success border-success" : i === activeIdx ? "border-void bg-void/20" : "border-cosmos-4 bg-transparent"
            }`}>
              {i < activeIdx ? (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              ) : (
                <span className={`font-space-mono text-[9px] font-bold ${i === activeIdx ? "text-void" : "text-haze-3"}`}>{i + 1}</span>
              )}
            </div>
            <span className={`font-space-mono text-[10px] tracking-[3px] ${i === activeIdx ? "text-void" : i < activeIdx ? "text-success" : "text-haze-3"}`}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-6 sm:w-10 h-px mx-2 transition-all ${i < activeIdx ? "bg-success" : "bg-cosmos-4"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Setup step ─── */
function SetupStep({
  onNext,
}: {
  onNext: (data: { name: string; playerCap: number; timerSeconds?: number }) => void;
}) {
  const [name, setName] = useState("");
  const [players, setPlayers] = useState(4);
  const [timer, setTimer] = useState(true);
  const [timerMin, setTimerMin] = useState(10);
  const [error, setError] = useState("");

  function handleNext() {
    if (!name.trim()) { setError("Arena name is required"); return; }
    setError("");
    onNext({ name: name.trim(), playerCap: players, timerSeconds: timer ? timerMin * 60 : undefined });
  }

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="flex flex-col gap-6">
      {/* Entry fee banner */}
      <div className="flex items-center gap-3 bg-void/10 border border-void/30 px-4 py-3">
        <span className="font-space-mono text-[10px] text-void tracking-widest">ENTRY FEE</span>
        <span className="flex-1 h-px bg-void/20" />
        <span className="font-orbitron font-bold text-sm text-void">50 coins / player</span>
        <span className="font-space-mono text-[9px] text-haze-3">charged when arena starts</span>
      </div>

      <div>
        <label className="block font-space-mono text-[11px] text-void tracking-[3px] mb-2 uppercase">Arena Name</label>
        <input type="text" maxLength={60} placeholder="e.g. Friday Coding Battle" value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full h-12 px-4 bg-cosmos-2 border border-cosmos-4 text-haze font-rajdhani text-base placeholder:text-haze-3 focus:outline-none focus:border-void focus:shadow-[0_0_0_2px_rgba(168,85,247,0.2)] transition-all" style={{ borderRadius: 0 }} />
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div>
          <label className="block font-space-mono text-[11px] text-void tracking-[3px] mb-2 uppercase">Players (2–20)</label>
          <div className="flex items-center border border-cosmos-4 bg-cosmos-2 h-12">
            <button type="button" onClick={() => setPlayers((n) => Math.max(2, n - 1))} className="cursor-target w-12 h-full text-haze-2 hover:text-void hover:bg-cosmos-3 transition-colors font-bold text-lg">−</button>
            <span className="flex-1 text-center font-orbitron font-bold text-lg text-haze">{players}</span>
            <button type="button" onClick={() => setPlayers((n) => Math.min(20, n + 1))} className="cursor-target w-12 h-full text-haze-2 hover:text-void hover:bg-cosmos-3 transition-colors font-bold text-lg">+</button>
          </div>
          <p className="font-space-mono text-[9px] text-haze-3 mt-1">Max prize pool: {players * ENTRY_FEE} coins</p>
        </div>
        <div>
          <label className="block font-space-mono text-[11px] text-void tracking-[3px] mb-2 uppercase">Timer</label>
          <button type="button" onClick={() => setTimer(!timer)} role="switch" aria-checked={timer}
            className={`cursor-target w-full h-12 flex items-center justify-center gap-2 border font-space-mono text-xs tracking-widest transition-all ${timer ? "border-void text-void bg-void/10" : "border-cosmos-4 text-haze-3"}`}>
            <span className={`w-3 h-3 rounded-full transition-colors ${timer ? "bg-void" : "bg-cosmos-4"}`} aria-hidden />
            {timer ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      {timer && (
        <div>
          <label className="block font-space-mono text-[11px] text-void tracking-[3px] mb-2 uppercase">Duration — {timerMin} minutes</label>
          <input type="range" min={1} max={60} value={timerMin} onChange={(e) => setTimerMin(Number(e.target.value))} className="w-full accent-violet-500" />
          <div className="flex justify-between font-space-mono text-[9px] text-haze-3 mt-1"><span>1 min</span><span>60 min</span></div>
        </div>
      )}

      {error && <p className="flex items-center gap-2 font-rajdhani text-sm text-danger"><AlertCircle size={14} /> {error}</p>}
      <Button variant="primary" size="lg" fullWidth magnetic onClick={handleNext}>
        NEXT — ADD QUESTIONS <ChevronRight size={16} />
      </Button>
    </motion.div>
  );
}

/* ─── Question card ─── */
function QuestionCard({
  q, index, total, arenaName,
  onChange, onDelete, onAnalyze,
}: {
  q: Question;
  index: number;
  total: number;
  arenaName: string;
  onChange: (taskRaw: string) => void;
  onDelete: () => void;
  onAnalyze: () => void;
}) {
  const catColor = q.analysis ? (CAT_COLORS[q.analysis.category] ?? "#9B8FC0") : "#4A3F70";

  return (
    <motion.div layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      className="bg-cosmos-2 border border-cosmos-4 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="font-space-mono text-[10px] text-void tracking-widest">QUESTION {index + 1}</span>
        <div className="flex items-center gap-2">
          {q.status === "done" && q.analysis?.valid && (
            <span className="font-space-mono text-[9px] text-success tracking-wider">✓ ANALYZED</span>
          )}
          {q.status === "invalid" && (
            <span className="font-space-mono text-[9px] text-danger tracking-wider">✗ INVALID</span>
          )}
          {total > 1 && (
            <button onClick={onDelete} className="cursor-target text-haze-3 hover:text-danger transition-colors p-1" aria-label="Remove question">
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      <textarea
        rows={4}
        placeholder={`Paste question ${index + 1} here. Can be any challenge:\n→ Build a function that reverses a string\n→ What is the capital of France?\n→ Calculate 847 × 23`}
        value={q.taskRaw}
        onChange={(e) => onChange(e.target.value)}
        disabled={q.status === "analyzing"}
        className="w-full px-4 py-3 bg-cosmos border border-cosmos-4 text-haze font-rajdhani text-base placeholder:text-haze-3 focus:outline-none focus:border-void focus:shadow-[0_0_0_2px_rgba(168,85,247,0.2)] transition-all resize-none disabled:opacity-50"
        style={{ borderRadius: 0 }}
      />

      {/* Error */}
      {q.error && <p className="font-rajdhani text-xs text-danger mt-2">{q.error}</p>}
      {q.status === "invalid" && q.analysis && (
        <p className="font-rajdhani text-xs text-danger mt-2">{q.analysis.invalidReason}</p>
      )}

      {/* Analysis preview */}
      {q.status === "done" && q.analysis?.valid && (
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="font-space-mono text-[9px] px-2 py-0.5 border" style={{ color: catColor, borderColor: `${catColor}44`, background: `${catColor}11` }}>
            {q.analysis.category.toUpperCase()}
          </span>
          <span className="font-space-mono text-[9px] px-2 py-0.5 border" style={{ color: DIFF_COLORS[q.analysis.difficulty], borderColor: `${DIFF_COLORS[q.analysis.difficulty]}44`, background: `${DIFF_COLORS[q.analysis.difficulty]}11` }}>
            {q.analysis.difficulty.toUpperCase()}
          </span>
          <span className="font-rajdhani text-xs text-haze-2 self-center">"{q.analysis.title}"</span>
        </div>
      )}

      <button
        onClick={onAnalyze}
        disabled={q.status === "analyzing" || !q.taskRaw.trim()}
        className={`cursor-target mt-3 w-full h-10 flex items-center justify-center gap-2 border font-space-mono text-[10px] tracking-widest transition-all disabled:opacity-40 ${
          q.status === "done" && q.analysis?.valid
            ? "border-success/40 text-success bg-success/5 hover:bg-success/10"
            : "border-void/40 text-void bg-void/5 hover:bg-void/10"
        }`}
      >
        {q.status === "analyzing" ? (
          <><Loader2 size={12} className="animate-spin" /> ANALYZING...</>
        ) : q.status === "done" && q.analysis?.valid ? (
          <>RE-ANALYZE</>
        ) : (
          <>ANALYZE WITH AI</>
        )}
      </button>
    </motion.div>
  );
}

/* ─── Questions step ─── */
function QuestionsStep({
  arenaName,
  questions,
  onAnalyze,
  onAdd,
  onDelete,
  onChange,
  onNext,
  onBack,
}: {
  arenaName: string;
  questions: Question[];
  onAnalyze: (localId: string) => void;
  onAdd: () => void;
  onDelete: (localId: string) => void;
  onChange: (localId: string, taskRaw: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const allValid = questions.every((q) => q.status === "done" && q.analysis?.valid);
  const anyAnalyzing = questions.some((q) => q.status === "analyzing");

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="flex flex-col gap-4">
      <AnimatePresence mode="popLayout">
        {questions.map((q, i) => (
          <QuestionCard
            key={q.localId}
            q={q}
            index={i}
            total={questions.length}
            arenaName={arenaName}
            onChange={(taskRaw) => onChange(q.localId, taskRaw)}
            onDelete={() => onDelete(q.localId)}
            onAnalyze={() => onAnalyze(q.localId)}
          />
        ))}
      </AnimatePresence>

      {questions.length < 10 && (
        <button onClick={onAdd}
          className="cursor-target flex items-center justify-center gap-2 h-12 border border-dashed border-cosmos-4 text-haze-3 hover:text-void hover:border-void/50 font-space-mono text-[10px] tracking-widest transition-all">
          <Plus size={14} /> ADD QUESTION ({questions.length}/10)
        </button>
      )}

      {!allValid && questions.length > 0 && (
        <p className="font-space-mono text-[10px] text-haze-3 text-center">
          Analyze all questions before continuing
        </p>
      )}

      <div className="flex gap-3 mt-2">
        <Button variant="secondary" size="md" onClick={onBack} className="flex-1">← BACK</Button>
        <Button variant="primary" size="md" onClick={onNext} disabled={!allValid || anyAnalyzing} className="flex-2 flex-grow">
          REVIEW & LAUNCH →
        </Button>
      </div>
    </motion.div>
  );
}

/* ─── Review step ─── */
function ReviewStep({
  arenaName,
  playerCap,
  questions,
  onLaunch,
  creating,
  createError,
  onBack,
}: {
  arenaName: string;
  playerCap: number;
  questions: Question[];
  onLaunch: () => void;
  creating: boolean;
  createError: string;
  onBack: () => void;
}) {
  const maxPrizePool = ENTRY_FEE * playerCap;

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="flex flex-col gap-5">
      <div className="bg-cosmos-2 border border-cosmos-4 p-5">
        <p className="font-space-mono text-[10px] text-void tracking-widest mb-3 uppercase">Arena Summary</p>
        <div className="flex flex-col gap-2 font-space-mono text-xs">
          <div className="flex justify-between"><span className="text-haze-3">Name</span><span className="text-haze">{arenaName}</span></div>
          <div className="flex justify-between"><span className="text-haze-3">Questions</span><span className="text-haze">{questions.length}</span></div>
          <div className="flex justify-between"><span className="text-haze-3">Entry fee</span><span className="text-void">{ENTRY_FEE} coins per player</span></div>
          <div className="flex justify-between"><span className="text-haze-3">Max prize pool</span><span className="text-crown font-bold">{maxPrizePool} coins</span></div>
          <p className="text-haze-3 text-[9px] pt-1 border-t border-cosmos-4">Coins are deducted from each player when the arena starts. Winner takes the full pool.</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {questions.map((q, i) => {
          const a = q.analysis!;
          const catColor = CAT_COLORS[a.category] ?? "#9B8FC0";
          return (
            <div key={q.localId} className="bg-cosmos-2 border border-cosmos-4 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-space-mono text-[9px] text-haze-3">Q{i + 1}</span>
                <div className="flex items-center gap-2">
                  <span className="font-space-mono text-[9px] px-2 py-0.5 border" style={{ color: catColor, borderColor: `${catColor}44`, background: `${catColor}11` }}>
                    {a.category.toUpperCase()}
                  </span>
                  <span className="font-space-mono text-[9px]" style={{ color: DIFF_COLORS[a.difficulty] }}>
                    {a.difficulty.toUpperCase()}
                  </span>
                </div>
              </div>
              <p className="font-rajdhani font-bold text-sm text-haze mb-1">"{a.title}"</p>
              <p className="font-rajdhani text-xs text-haze-2 line-clamp-2">{a.taskNormalised}</p>
              {a.publicTests && <p className="font-space-mono text-[9px] text-haze-3 mt-1">{a.publicTests.length} public · {a.hiddenTests?.length ?? 0} hidden tests</p>}
            </div>
          );
        })}
      </div>

      {createError && <p className="flex items-center gap-2 font-rajdhani text-sm text-danger"><AlertCircle size={14} /> {createError}</p>}

      <div className="flex gap-3 mt-2">
        <Button variant="secondary" size="md" onClick={onBack} className="flex-1">← BACK</Button>
        <Button variant="primary" size="lg" onClick={onLaunch} disabled={creating} loading={creating} className="flex-grow">
          {creating ? "CREATING…" : "CREATE ARENA (FREE) →"}
        </Button>
      </div>
    </motion.div>
  );
}

/* ─── Lobby view ─── */
function LobbyView({ room }: { room: CreatedRoom }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const inviteLink = `${typeof window !== "undefined" ? window.location.origin : ""}/join/${room.id}`;

  const copy = async () => {
    await navigator.clipboard.writeText(inviteLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="font-orbitron font-black text-3xl text-haze mb-1">ARENA CREATED</h2>
        <p className="font-rajdhani font-bold text-lg text-void">{room.name}</p>
        <p className="font-space-mono text-[10px] text-success mt-2 tracking-widest">✓ LOBBY READY</p>
      </div>

      <div>
        <p className="font-space-mono text-[10px] text-haze-3 tracking-widest mb-2 uppercase">Invite Link</p>
        <div className="flex items-center gap-0 border border-cosmos-4">
          <span className="flex-1 font-space-mono text-xs text-haze-2 px-3 py-3 bg-cosmos-2 truncate">{inviteLink}</span>
          <button onClick={copy}
            className={`cursor-target flex items-center gap-2 px-4 py-3 border-l border-cosmos-4 font-space-mono text-xs transition-colors ${copied ? "text-success bg-success/10" : "text-void hover:bg-void/10"}`}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "COPIED!" : "COPY"}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 mt-2">
        <Button variant="primary" size="lg" fullWidth magnetic onClick={() => router.push(`/lobby/${room.id}`)}>
          ENTER LOBBY →
        </Button>
        <button onClick={() => router.push("/dashboard")} className="font-space-mono text-[11px] text-haze-3 hover:text-void transition-colors text-center py-2">
          Go to Dashboard
        </button>
      </div>
    </motion.div>
  );
}

/* ─── Main ─── */
export default function CreatePage() {
  const [step, setStep] = useState<Step>("setup");

  const [setupData, setSetupData] = useState<{
    name: string; playerCap: number; timerSeconds?: number;
  } | null>(null);

  const [questions, setQuestions] = useState<Question[]>([
    { localId: crypto.randomUUID(), taskRaw: "", status: "idle" },
  ]);

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createdRoom, setCreatedRoom] = useState<CreatedRoom | null>(null);

  /* ─── Analyze a single question ─── */
  const handleAnalyze = useCallback(async (localId: string) => {
    const q = questions.find((x) => x.localId === localId);
    if (!q || !q.taskRaw.trim()) return;

    setQuestions((prev) => prev.map((x) => x.localId === localId ? { ...x, status: "analyzing", error: undefined } : x));

    try {
      const res = await fetchWithAuth("/api/rooms/analyse", {
        method: "POST",
        body: JSON.stringify({ taskRaw: q.taskRaw, arenaName: setupData?.name ?? "" }),
      });

      if (!res.ok) {
        const err = await res.json() as { error?: string };
        setQuestions((prev) => prev.map((x) => x.localId === localId ? { ...x, status: "error", error: err.error ?? "Analysis failed" } : x));
        return;
      }

      const { analysis } = await res.json() as { analysis: AIAnalysis };

      if (!analysis.valid) {
        setQuestions((prev) => prev.map((x) => x.localId === localId ? { ...x, status: "invalid", analysis } : x));
        return;
      }

      setQuestions((prev) => prev.map((x) => x.localId === localId ? { ...x, status: "done", analysis } : x));
    } catch {
      setQuestions((prev) => prev.map((x) => x.localId === localId ? { ...x, status: "error", error: "Could not reach AI service" } : x));
    }
  }, [questions, setupData]);

  /* ─── Launch room ─── */
  const handleLaunch = useCallback(async () => {
    if (!setupData) return;
    setCreating(true);
    setCreateError("");

    try {
      const questionsPayload = questions.map((q, i) => ({
        index: i,
        taskRaw: q.taskRaw,
        taskNormalised: q.analysis!.taskNormalised,
        canonicalAnswer: q.analysis!.canonicalAnswer,
        category: q.analysis!.category,
        title: q.analysis!.title,
        difficulty: q.analysis!.difficulty,
        starterCode: q.analysis!.starterCode,
        publicTests: q.analysis!.publicTests,
        hiddenTests: q.analysis!.hiddenTests,
      }));

      const res = await fetchWithAuth("/api/rooms", {
        method: "POST",
        body: JSON.stringify({
          name: setupData.name,
          playerCap: setupData.playerCap,
          timerSeconds: setupData.timerSeconds,
          questions: questionsPayload,
        }),
      });

      if (!res.ok) {
        let errMsg = "Failed to create room";
        try {
          const err = await res.json() as { error?: string };
          errMsg = err.error ?? errMsg;
        } catch {}
        setCreateError(errMsg);
        return;
      }

      const { room } = await res.json() as { room: CreatedRoom };

      // For single coding question, save test cases to the testcases table
      if (questions.length === 1) {
        const first = questions[0];
        if (first.analysis?.category === "coding") {
          const allTests = [
            ...(first.analysis.publicTests ?? []).map((t) => ({ ...t, isHidden: false })),
            ...(first.analysis.hiddenTests ?? []).map((t) => ({ ...t, isHidden: true })),
          ];
          if (allTests.length > 0) {
            await fetchWithAuth(`/api/rooms/${room.id}/testcases`, {
              method: "POST",
              body: JSON.stringify({ tests: allTests }),
            });
          }
        }
      }

      setCreatedRoom(room);
      setStep("lobby");
    } catch {
      setCreateError("Something went wrong. Please try again.");
    } finally {
      setCreating(false);
    }
  }, [setupData, questions]);

  return (
    <AppLayout>
      <div className="px-5 md:px-8 lg:px-10 py-8 md:py-12 max-w-3xl mx-auto w-full">
        <p className="font-space-mono text-[11px] text-void tracking-[3px] uppercase mb-2">New arena</p>
        <h1 className="font-zen-dots text-2xl md:text-3xl text-haze mb-2">Create your arena</h1>
        <p className="font-rajdhani text-base text-haze-2 mb-10">Set up your challenge. The AI validates and builds the rest.</p>

        <StepIndicator step={step} />

        <AnimatePresence mode="wait">
          {step === "setup" && (
            <SetupStep
              key="setup"
              onNext={(data) => {
                setSetupData(data);
                setStep("questions");
              }}
            />
          )}

          {step === "questions" && setupData && (
            <QuestionsStep
              key="questions"
              arenaName={setupData.name}
              questions={questions}
              onAnalyze={handleAnalyze}
              onAdd={() => setQuestions((prev) => [...prev, { localId: crypto.randomUUID(), taskRaw: "", status: "idle" }])}
              onDelete={(id) => setQuestions((prev) => prev.filter((q) => q.localId !== id))}
              onChange={(id, taskRaw) => setQuestions((prev) => prev.map((q) => q.localId === id ? { ...q, taskRaw, status: q.status === "done" || q.status === "invalid" ? "idle" : q.status } : q))}
              onNext={() => setStep("review")}
              onBack={() => setStep("setup")}
            />
          )}

          {step === "review" && setupData && (
            <ReviewStep
              key="review"
              arenaName={setupData.name}
              playerCap={setupData.playerCap}
              questions={questions}
              onLaunch={handleLaunch}
              creating={creating}
              createError={createError}
              onBack={() => setStep("questions")}
            />
          )}

          {step === "lobby" && createdRoom && (
            <LobbyView key="lobby" room={createdRoom} />
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
