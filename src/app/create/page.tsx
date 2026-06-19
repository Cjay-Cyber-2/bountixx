"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Plus, Trash2, Loader2, ChevronRight } from "lucide-react";
import { InviteSharePanel } from "@/components/arena/InviteSharePanel";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppPage } from "@/components/landing/_section";
import { Button } from "@/components/ui/Button";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { readApiError } from "@/lib/readApiError";
import { ENTRY_FEE, ENTRY_FEE_SUMMARY, HOSTING_FREE_SUMMARY, maxBountyPool } from "@/lib/coins";
import { LANGUAGES, LANGUAGE_KEYS, getLanguage, type LanguageKey } from "@/lib/languages";

/* ─── Types ─── */
type Category = "coding" | "trivia" | "logic" | "math" | "writing" | "design" | "meme";
type Difficulty = "rookie" | "challenger" | "elite" | "legendary";
type Step = "setup" | "questions" | "review" | "lobby";

interface AIAnalysis {
  valid: boolean;
  invalidReason?: string;
  needsClarification?: boolean;
  clarificationReason?: string;
  suggestions?: string[];
  category: Category;
  title: string;
  difficulty: Difficulty;
  taskNormalised: string;
  language?: LanguageKey | null;
  ioFormat?: string;
  starterCode?: string;
  publicTests?: { input: string; expectedOutput: string }[];
  hiddenTests?: { input: string; expectedOutput: string }[];
  canonicalAnswer?: string;
}

interface Question {
  localId: string;
  taskRaw: string;
  status: "idle" | "analyzing" | "done" | "error" | "invalid" | "clarify";
  analysis?: AIAnalysis;
  error?: string;
}

interface CreatedRoom { id: string; name: string; status: string; }

function StepActions({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mt-8 w-full sm:w-auto">
      {children}
    </div>
  );
}

/* ─── Constants ─── */
const CAT_COLORS: Record<string, string> = {
  coding: "#F92313", trivia: "#4E2725", logic: "#F92313", math: "#4E2725",
  writing: "#F92313", design: "#4E2725", meme: "#F92313",
};
const DIFF_COLORS: Record<Difficulty, string> = {
  rookie: "#DDEAE1", challenger: "#F92313", elite: "#4E2725", legendary: "#F92313",
};

function parseBulkQuestions(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
    <div className="mb-8 md:mb-10">
      <p className="sm:hidden text-xs font-medium text-plum mb-3">
        Step {activeIdx + 1} of {steps.length} · {steps[activeIdx]?.label}
      </p>
      <div className="flex items-center justify-start sm:justify-center gap-2 sm:gap-3 flex-wrap">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="flex items-center gap-2 shrink-0">
              <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                i < activeIdx ? "bg-[var(--brand-primary)] border-[var(--brand-primary)] text-white" : i === activeIdx ? "border-[var(--brand-primary)] bg-[var(--void-tint)]" : "border-[var(--border-2)] bg-transparent"
              }`}>
                {i < activeIdx ? (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                ) : (
                  <span className={`text-[10px] font-semibold tabular-nums ${i === activeIdx ? "text-[var(--brand-primary)]" : "text-haze-3"}`}>{i + 1}</span>
                )}
              </div>
              <span className={`hidden sm:inline text-xs font-medium ${i === activeIdx ? "text-haze" : i < activeIdx ? "text-[var(--brand-primary)]" : "text-haze-3"}`}>
                {s.label.charAt(0) + s.label.slice(1).toLowerCase()}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-8 sm:w-12 h-px transition-all ${i < activeIdx ? "bg-[var(--brand-primary)]" : "bg-[var(--border-2)]"}`} />
            )}
          </div>
        ))}
      </div>
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
  const [players, setPlayers] = useState(2);
  const [timer, setTimer] = useState(true);
  const [timerMin, setTimerMin] = useState(10);
  const [error, setError] = useState("");

  function handleNext() {
    if (!name.trim()) { setError("Arena name is required"); return; }
    setError("");
    onNext({ name: name.trim(), playerCap: players, timerSeconds: timer ? timerMin * 60 : undefined });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[1.15fr_1fr] gap-6 md:gap-8 w-full"
    >
      {/* Left Column */}
      <div className="flex flex-col gap-6 min-w-0">
        {/* Entry fee banner */}
        <div className="flex flex-col gap-2 rounded-xl bg-[var(--void-tint)] border border-[var(--border-accent)] px-5 py-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-xs font-medium text-plum">Bounty entry fee</span>
            <span className="font-stats font-semibold text-sm text-haze">{ENTRY_FEE} coins / player</span>
          </div>
          <span className="text-xs text-haze-2 leading-relaxed">{ENTRY_FEE_SUMMARY}</span>
          <span className="text-xs text-haze-3">{HOSTING_FREE_SUMMARY}</span>
        </div>

        <div>
          <label className="bx-label">Arena name</label>
          <input
            type="text"
            maxLength={60}
            placeholder="e.g. Friday Coding Battle"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bx-input"
          />
        </div>
      </div>

      {/* Right Column */}
      <div className="flex flex-col gap-6 min-w-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-5">
          <div>
            <label className="bx-label">Players (2–20)</label>
            <div className="flex items-center border border-[var(--border-2)] bg-[var(--surface-inset)] h-12 rounded-xl overflow-hidden">
              <button type="button" onClick={() => setPlayers((n) => Math.max(2, n - 1))} className="cursor-target w-12 h-full text-haze-2 hover:text-plum hover:bg-[var(--surface-hover)] transition-colors font-semibold text-lg">−</button>
              <span className="flex-1 text-center font-stats font-semibold text-lg text-haze tabular-nums">{players}</span>
              <button type="button" onClick={() => setPlayers((n) => Math.min(20, n + 1))} className="cursor-target w-12 h-full text-haze-2 hover:text-plum hover:bg-[var(--surface-hover)] transition-colors font-semibold text-lg">+</button>
            </div>
            <p className="text-xs text-haze-3 mt-2">Max bounty pool: {maxBountyPool(players)} coins ({ENTRY_FEE} × competing players)</p>
          </div>
          <div>
            <label className="bx-label">Timer</label>
            <button type="button" onClick={() => setTimer(!timer)} role="switch" aria-checked={timer}
              className={`cursor-target w-full h-12 flex items-center justify-center gap-2 border rounded-xl text-sm font-medium transition-all ${timer ? "border-plum text-plum bg-[var(--void-tint)]" : "border-[var(--border-2)] text-haze-3"}`}>
              <span className={`w-2.5 h-2.5 rounded-full transition-colors ${timer ? "bg-plum" : "bg-[var(--border-2)]"}`} aria-hidden />
              {timer ? "On" : "Off"}
            </button>
          </div>
        </div>

        {timer && (
          <div>
            <label className="bx-label">Duration — {timerMin} minutes</label>
            <input type="range" min={1} max={60} value={timerMin} onChange={(e) => setTimerMin(Number(e.target.value))} className="w-full accent-[#F92313]" />
            <div className="flex justify-between text-xs text-haze-3 mt-2"><span>1 min</span><span>60 min</span></div>
          </div>
        )}
      </div>

      {error && (
        <div className="md:col-span-2">
          <p className="flex items-center gap-2 text-sm text-danger"><AlertCircle size={14} /> {error}</p>
        </div>
      )}

      <div className="md:col-span-2">
        <StepActions>
          <Button variant="primary" size="lg" className="w-full sm:w-auto sm:min-w-[220px]" magnetic onClick={handleNext}>
            Next — add questions <ChevronRight size={16} />
          </Button>
        </StepActions>
      </div>
    </motion.div>
  );
}

/* ─── Question card ─── */
function QuestionCard({
  q, index, total, arenaName,
  onChange, onAnswerChange, onDelete, onAnalyze, onBulkPaste, showAnalyzeButton,
}: {
  q: Question;
  index: number;
  total: number;
  arenaName: string;
  onChange: (taskRaw: string) => void;
  onAnswerChange: (answer: string) => void;
  onDelete: () => void;
  onAnalyze: (languageHint?: string) => void;
  onBulkPaste: (lines: string[], startIndex: number) => void;
  showAnalyzeButton: boolean;
}) {
  const catColor = q.analysis ? (CAT_COLORS[q.analysis.category] ?? "#9B8FC0") : "#4A3F70";
  void arenaName;
  const [pickLang, setPickLang] = useState<LanguageKey>("python");

  return (
    <motion.div layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      className="rounded-xl border border-[var(--border-1)] bg-[var(--surface-inset)] p-6 md:p-8">
      <div className="flex items-center justify-between mb-3">
        <span className="font-space-mono text-[10px] text-void tracking-widest">QUESTION {index + 1}</span>
        <div className="flex items-center gap-2">
          {q.status === "done" && q.analysis?.valid && (
            <span className="font-space-mono text-[9px] text-success tracking-wider">✓ READY</span>
          )}
          {q.status === "clarify" && (
            <span className="font-space-mono text-[9px] text-crown tracking-wider">⚠ NEEDS INPUT</span>
          )}
          {q.status === "invalid" && (
            <span className="font-space-mono text-[9px] text-danger tracking-wider">✗ INVALID</span>
          )}
          {total > 1 && (
            <button onClick={onDelete} className="cursor-target text-haze-3 hover:text-danger transition-colors p-2 rounded-lg hover:bg-danger/10" aria-label="Remove question">
              <Trash2 size={20} />
            </button>
          )}
        </div>
      </div>

      <textarea
        rows={4}
        placeholder={`Paste question ${index + 1} here — or paste multiple lines to fill every question slot at once.`}
        value={q.taskRaw}
        onChange={(e) => onChange(e.target.value)}
        onPaste={(e) => {
          const text = e.clipboardData.getData("text");
          const lines = parseBulkQuestions(text);
          if (lines.length > 1) {
            e.preventDefault();
            onBulkPaste(lines, index);
          }
        }}
        disabled={q.status === "analyzing"}
        className="w-full px-4 py-3 bg-cosmos border border-cosmos-4 text-haze font-rajdhani text-base placeholder:text-haze-3 focus:outline-none focus:border-void focus:shadow-[0_0_0_2px_rgba(168,85,247,0.2)] transition-all resize-none disabled:opacity-50"
        style={{ borderRadius: 0 }}
      />

      {/* Error */}
      {q.error && <p className="font-rajdhani text-xs text-danger mt-2">{q.error}</p>}
      {q.status === "invalid" && q.analysis && (
        <p className="font-rajdhani text-xs text-danger mt-2">{q.analysis.invalidReason}</p>
      )}

      {/* Clarification needed — task is real but the AI needs the host to decide something */}
      {q.status === "clarify" && q.analysis && (
        <div className="mt-3 border border-crown/30 bg-crown/5 p-4">
          <div className="flex items-start gap-2 mb-3">
            <AlertCircle size={14} className="text-crown shrink-0 mt-0.5" aria-hidden />
            <p className="font-rajdhani text-sm text-haze leading-snug">{q.analysis.clarificationReason}</p>
          </div>

          {q.analysis.category === "coding" ? (
            <>
              <p className="font-space-mono text-[9px] text-haze-3 tracking-widest uppercase mb-2">
                Pick the language for this challenge
              </p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {LANGUAGE_KEYS.map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setPickLang(k)}
                    className={`cursor-target font-space-mono text-[10px] px-2.5 py-1.5 border transition-all ${
                      pickLang === k
                        ? "border-void text-void bg-void/10"
                        : "border-cosmos-4 text-haze-3 hover:text-haze-2 hover:border-void/40"
                    }`}
                  >
                    {LANGUAGES[k].label}
                  </button>
                ))}
              </div>
              <Button variant="primary" size="sm" fullWidth onClick={() => onAnalyze(pickLang)}>
                BUILD CODING ROOM IN {LANGUAGES[pickLang].label.toUpperCase()}
              </Button>
            </>
          ) : (
            <>
              {q.analysis.suggestions && q.analysis.suggestions.length > 0 && (
                <ul className="mb-3 space-y-1">
                  {q.analysis.suggestions.map((s, i) => (
                    <li key={i} className="font-rajdhani text-xs text-haze-2 flex gap-2">
                      <span className="text-crown">›</span> {s}
                    </li>
                  ))}
                </ul>
              )}
              <p className="font-space-mono text-[9px] text-haze-3">
                Edit the question above to be more specific, then re-analyze.
              </p>
            </>
          )}
        </div>
      )}

      {/* Analysis preview */}
      {q.status === "done" && q.analysis?.valid && (
        <>
          <div className="mt-3 flex flex-wrap gap-2 items-center">
            <span className="font-space-mono text-sm px-3 py-1 border" style={{ color: catColor, borderColor: `${catColor}44`, background: `${catColor}11` }}>
              {q.analysis.category.toUpperCase()}
            </span>
            <span className="font-space-mono text-sm px-3 py-1 border" style={{ color: DIFF_COLORS[q.analysis.difficulty], borderColor: `${DIFF_COLORS[q.analysis.difficulty]}44`, background: `${DIFF_COLORS[q.analysis.difficulty]}11` }}>
              {q.analysis.difficulty.toUpperCase()}
            </span>
            <span className="font-rajdhani text-base text-haze font-semibold">"{q.analysis.title}"</span>
          </div>

          {/* AI answer — visible and editable before the room is created */}
          {q.analysis.category !== "coding" && (
            <div className="mt-4 border border-crown/30 bg-crown/5 p-4 rounded-lg">
              <label
                htmlFor={`answer-${q.localId}`}
                className="font-space-mono text-sm text-crown tracking-widest uppercase block mb-2"
              >
                Correct Answer (AI) — edit if wrong
              </label>
              <input
                id={`answer-${q.localId}`}
                type="text"
                value={q.analysis.canonicalAnswer ?? ""}
                onChange={(e) => onAnswerChange(e.target.value)}
                placeholder="The answer players must match"
                className="w-full h-11 px-4 bg-cosmos border border-cosmos-4 text-haze font-rajdhani text-base focus:outline-none focus:border-crown transition-colors rounded-lg"
              />
                    <p className="font-rajdhani text-sm text-haze-2 mt-2 leading-relaxed">
                      The AI fact-checks this answer. It must be one specific name, number, or fact — edit it if the AI got it wrong.
                    </p>
            </div>
          )}

          {/* Coding: environment summary (language + I/O + tests) */}
          {q.analysis.category === "coding" && (
            <div className="mt-3 border border-void/30 bg-void/5 p-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-space-mono text-[9px] text-void tracking-widest uppercase">Coding Environment</span>
                <select
                  value={q.analysis.language ?? "javascript"}
                  onChange={(e) => onAnalyze(e.target.value)}
                  className="bg-cosmos border border-cosmos-4 text-haze-2 font-space-mono text-[10px] px-2 py-1 focus:outline-none focus:border-void"
                  aria-label="Change language"
                >
                  {LANGUAGE_KEYS.map((k) => (
                    <option key={k} value={k}>{LANGUAGES[k].label}</option>
                  ))}
                </select>
              </div>
              <p className="font-rajdhani text-xs text-haze-2 mb-1.5">
                Editor language: <span className="text-void font-semibold">{getLanguage(q.analysis.language).label}</span>
              </p>
              {q.analysis.ioFormat && (
                <p className="font-space-mono text-[9px] text-haze-3 leading-relaxed mb-1.5">I/O: {q.analysis.ioFormat}</p>
              )}
              <p className="font-space-mono text-[9px] text-haze-3">
                {q.analysis.publicTests?.length ?? 0} public + {q.analysis.hiddenTests?.length ?? 0} hidden tests · change the language to rebuild the room
              </p>
            </div>
          )}
        </>
      )}

      {showAnalyzeButton && (
      <button
        onClick={() => onAnalyze()}
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
      )}
    </motion.div>
  );
}

/* ─── Questions step ─── */
function QuestionsStep({
  arenaName,
  questions,
  onAnalyzeAll,
  onAnalyzeOne,
  onAdd,
  onDelete,
  onChange,
  onAnswerChange,
  onBulkPaste,
  onNext,
  onBack,
  batchAnalyzing,
  analyzeProgress,
}: {
  arenaName: string;
  questions: Question[];
  onAnalyzeAll: () => void;
  onAnalyzeOne: (localId: string, languageHint?: string) => void;
  onAdd: () => void;
  onDelete: (localId: string) => void;
  onChange: (localId: string, taskRaw: string) => void;
  onAnswerChange: (localId: string, answer: string) => void;
  onBulkPaste: (lines: string[], startIndex: number) => void;
  onNext: () => void;
  onBack: () => void;
  batchAnalyzing: boolean;
  analyzeProgress: { current: number; total: number } | null;
}) {
  const allValid = questions.every((q) => {
    if (q.status !== "done" || !q.analysis?.valid || q.analysis.needsClarification) return false;
    const category = q.analysis.category;
    if (["trivia", "logic", "math"].includes(category)) {
      return Boolean(q.analysis.canonicalAnswer?.trim());
    }
    return true;
  });
  const anyAnalyzing = questions.some((q) => q.status === "analyzing") || batchAnalyzing;
  const multi = questions.length > 1;
  const hasContent = questions.some((q) => q.taskRaw.trim());

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
            onAnswerChange={(answer) => onAnswerChange(q.localId, answer)}
            onBulkPaste={onBulkPaste}
            onDelete={() => onDelete(q.localId)}
            onAnalyze={(hint) => onAnalyzeOne(q.localId, hint)}
            showAnalyzeButton={!multi}
          />
        ))}
      </AnimatePresence>

      {multi && (
        <>
          <p className="font-rajdhani text-sm text-haze-3 text-center">
            Tip: paste multiple questions at once (one per line) into any question box — like Render env import.
          </p>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={onAnalyzeAll}
            disabled={anyAnalyzing || !hasContent}
            loading={batchAnalyzing}
            className="gap-2"
          >
            {batchAnalyzing && analyzeProgress
              ? `ANALYZING ${analyzeProgress.current} OF ${analyzeProgress.total}…`
              : batchAnalyzing
                ? "ANALYZING ALL QUESTIONS…"
                : "ANALYZE ALL WITH AI"}
          </Button>
        </>
      )}

      {!multi && questions.length === 1 && questions[0].status !== "done" && (
        <p className="font-rajdhani text-sm text-haze-3 text-center">Analyze your question before continuing.</p>
      )}

      {questions.length < 10 && (
        <button onClick={onAdd}
          className="cursor-target flex items-center justify-center gap-2 h-12 border border-dashed border-cosmos-4 text-haze-3 hover:text-void hover:border-void/50 font-space-mono text-[10px] tracking-widest transition-all">
          <Plus size={14} /> ADD QUESTION ({questions.length}/10)
        </button>
      )}

      {!allValid && questions.length > 0 && (
        <p className="font-space-mono text-[10px] text-haze-3 text-center">
          Analyze all questions and confirm each has a specific correct answer before continuing
        </p>
      )}

      <StepActions>
        <Button variant="secondary" size="md" onClick={onBack} className="w-full sm:flex-1">← BACK</Button>
        <Button variant="primary" size="md" onClick={onNext} disabled={!allValid || anyAnalyzing} className="w-full sm:flex-1">
          REVIEW & LAUNCH →
        </Button>
      </StepActions>
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
  const maxPrizePool = maxBountyPool(playerCap);

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="flex flex-col gap-6">
      <div className="bg-cosmos-2 border border-cosmos-4 p-5 md:p-6">
        <p className="font-space-mono text-[10px] text-void tracking-widest mb-3 uppercase">Arena Summary</p>
        <div className="flex flex-col gap-2 font-space-mono text-xs">
          <div className="flex justify-between"><span className="text-haze-3">Name</span><span className="text-haze">{arenaName}</span></div>
          <div className="flex justify-between"><span className="text-haze-3">Questions</span><span className="text-haze">{questions.length}</span></div>
          <div className="flex justify-between"><span className="text-haze-3">Entry fee</span><span className="text-coin-gold">{ENTRY_FEE} coins / player → bounty</span></div>
          <div className="flex justify-between"><span className="text-haze-3">Max bounty pool</span><span className="text-coin-gold font-bold">{maxPrizePool} coins</span></div>
          <p className="text-haze-3 text-[9px] pt-2 border-t border-cosmos-4 mt-2 leading-relaxed">
            {HOSTING_FREE_SUMMARY} {ENTRY_FEE_SUMMARY}
          </p>
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
              {a.category !== "coding" && a.canonicalAnswer && (
                <p className="font-space-mono text-[9px] text-crown mt-1.5 truncate">
                  ANSWER: <span className="text-haze">{a.canonicalAnswer}</span>
                </p>
              )}
              {a.publicTests && <p className="font-space-mono text-[9px] text-haze-3 mt-1">{a.publicTests.length} public · {a.hiddenTests?.length ?? 0} hidden tests</p>}
            </div>
          );
        })}
      </div>

      {createError && (
        <p className="flex items-center justify-center gap-2 font-rajdhani text-sm text-danger text-center">
          <AlertCircle size={14} /> {createError}
        </p>
      )}

      <StepActions>
        <Button variant="secondary" size="md" onClick={onBack} className="w-full sm:flex-1">← BACK</Button>
        <Button variant="primary" size="lg" onClick={onLaunch} disabled={creating} loading={creating} className="w-full sm:flex-1">
          {creating ? "CREATING…" : "CREATE ARENA (FREE) →"}
        </Button>
      </StepActions>
    </motion.div>
  );
}

/* ─── Lobby view ─── */
function LobbyView({ room }: { room: CreatedRoom }) {
  const router = useRouter();

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="font-orbitron font-black text-3xl text-haze mb-1">ARENA CREATED</h2>
        <p className="font-rajdhani font-bold text-lg text-void">{room.name}</p>
        <p className="font-space-mono text-[10px] text-success mt-2 tracking-widest">✓ LOBBY READY</p>
      </div>

      <div>
        <p className="font-space-mono text-[10px] text-haze-3 tracking-widest mb-3 uppercase">Invite friends</p>
        <InviteSharePanel roomId={room.id} qrSize={132} />
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

  /* ─── Analyze a single question (optionally forcing a coding language) ─── */
  const [batchAnalyzing, setBatchAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState<{ current: number; total: number } | null>(null);

  const applyAnalysisResult = useCallback((localId: string, analysis: AIAnalysis) => {
    if (!analysis.valid) {
      setQuestions((prev) => prev.map((x) => (x.localId === localId ? { ...x, status: "invalid", analysis } : x)));
      return;
    }
    if (analysis.needsClarification) {
      setQuestions((prev) => prev.map((x) => (x.localId === localId ? { ...x, status: "clarify", analysis } : x)));
      return;
    }
    setQuestions((prev) => prev.map((x) => (x.localId === localId ? { ...x, status: "done", analysis } : x)));
  }, []);

  const runAnalyzeRequest = useCallback(async (
    localId: string,
    taskRaw: string,
    languageHint?: string,
  ): Promise<boolean> => {
    setQuestions((prev) => prev.map((x) => (x.localId === localId ? { ...x, status: "analyzing", error: undefined } : x)));

    try {
      const res = await fetchWithAuth("/api/rooms/analyse", {
        method: "POST",
        body: JSON.stringify({
          taskRaw,
          arenaName: setupData?.name ?? "",
          languageHint,
        }),
      });

      if (!res.ok) {
        const error = await readApiError(res);
        setQuestions((prev) => prev.map((x) => (x.localId === localId ? { ...x, status: "error", error } : x)));
        return false;
      }

      const data = (await res.json()) as { analysis?: AIAnalysis };
      if (!data.analysis) {
        setQuestions((prev) => prev.map((x) => (x.localId === localId ? { ...x, status: "error", error: "Invalid response from server" } : x)));
        return false;
      }

      applyAnalysisResult(localId, data.analysis);
      return true;
    } catch (err) {
      const message =
        err instanceof TypeError
          ? "Network error — check your connection and try again"
          : "Could not reach AI service";
      setQuestions((prev) => prev.map((x) => (x.localId === localId ? { ...x, status: "error", error: message } : x)));
      return false;
    }
  }, [applyAnalysisResult, setupData?.name]);

  const handleAnalyzeOne = useCallback(async (localId: string, languageHint?: string) => {
    const q = questions.find((x) => x.localId === localId);
    if (!q || !q.taskRaw.trim()) return;
    await runAnalyzeRequest(localId, q.taskRaw, languageHint);
  }, [questions, runAnalyzeRequest]);

  const handleBulkPaste = useCallback((lines: string[], startIndex: number) => {
    setQuestions((prev) => {
      const next = [...prev];
      for (let i = 0; i < lines.length && startIndex + i < 10; i++) {
        const idx = startIndex + i;
        if (idx < next.length) {
          next[idx] = {
            ...next[idx],
            taskRaw: lines[i],
            status: "idle",
            analysis: undefined,
            error: undefined,
          };
        } else {
          next.push({ localId: crypto.randomUUID(), taskRaw: lines[i], status: "idle" });
        }
      }
      return next.slice(0, 10);
    });
  }, []);

  const handleAnalyzeAll = useCallback(async () => {
    const pending = questions.filter((q) => q.taskRaw.trim());
    if (pending.length === 0) return;

    setBatchAnalyzing(true);
    setAnalyzeProgress({ current: 0, total: pending.length });

    for (let i = 0; i < pending.length; i++) {
      const q = pending[i];
      setAnalyzeProgress({ current: i + 1, total: pending.length });
      await runAnalyzeRequest(q.localId, q.taskRaw);

      if (i < pending.length - 1) {
        await sleep(3500);
      }
    }

    setBatchAnalyzing(false);
    setAnalyzeProgress(null);
  }, [questions, runAnalyzeRequest]);

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
        language: q.analysis!.language ?? undefined,
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
      <AppPage>
        <p className="text-xs font-medium text-plum mb-2">New arena</p>
        <h1 className="font-display text-3xl md:text-4xl text-haze mb-3 text-balance">Create your arena</h1>
        <p className="text-base md:text-lg text-haze-2 mb-8 md:mb-10 max-w-3xl leading-relaxed">
          Set up your challenge. The AI validates and builds the rest.
        </p>

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
              onAnalyzeOne={handleAnalyzeOne}
              onAnalyzeAll={handleAnalyzeAll}
              batchAnalyzing={batchAnalyzing}
              analyzeProgress={analyzeProgress}
              onBulkPaste={handleBulkPaste}
              onAdd={() => setQuestions((prev) => [...prev, { localId: crypto.randomUUID(), taskRaw: "", status: "idle" }])}
              onDelete={(id) => setQuestions((prev) => prev.filter((q) => q.localId !== id))}
              onChange={(id, taskRaw) => setQuestions((prev) => prev.map((q) => q.localId === id ? { ...q, taskRaw, status: q.status === "done" || q.status === "invalid" || q.status === "clarify" ? "idle" : q.status } : q))}
              onAnswerChange={(id, answer) => setQuestions((prev) => prev.map((q) =>
                q.localId === id && q.analysis
                  ? { ...q, analysis: { ...q.analysis, canonicalAnswer: answer } }
                  : q
              ))}
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
      </AppPage>
    </AppLayout>
  );
}
