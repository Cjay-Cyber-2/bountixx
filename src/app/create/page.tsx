"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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
import { isBulkQuestionPaste, looksLikeBulkQuestionInput, parseBulkQuestions, readClipboardQuestions } from "@/lib/parseBulkQuestions";
import { isAiRateLimitError } from "@/lib/apiErrors";

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
    <div className="flex flex-col sm:flex-row gap-4 mt-10 md:mt-12 w-full">
      {children}
    </div>
  );
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
const DIFF_COLORS: Record<Difficulty, string> = {
  rookie:     "#6EE7B7",
  challenger: "#A78BFA",
  elite:      "#7C5CFF",
  legendary:  "#F0A500",
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mergeBulkPaste(
  prev: Question[],
  lines: string[],
  startIndex: number,
): Question[] {
  const next = [...prev];
  for (let i = 0; i < lines.length && startIndex + i < 10; i++) {
    const idx = startIndex + i;
    const card: Question = {
      localId: next[idx]?.localId ?? crypto.randomUUID(),
      taskRaw: lines[i],
      status: "idle",
      analysis: undefined,
      error: undefined,
    };
    if (idx < next.length) next[idx] = card;
    else next.push(card);
  }
  return next.slice(0, 10);
}

/* ─── Step indicator ─── */
function StepIndicator({ step }: { step: Step }) {
  const steps = [
    { id: "setup", label: "Setup" },
    { id: "questions", label: "Questions" },
    { id: "review", label: "Review" },
    { id: "lobby", label: "Launch" },
  ];
  const activeIdx = ["setup", "questions", "review", "lobby"].indexOf(step);
  return (
    <div className="mb-12 md:mb-16">
      <p className="sm:hidden font-mono text-xs text-[var(--brand-primary)] tracking-widest uppercase mb-4">
        Step {activeIdx + 1} of {steps.length} · {steps[activeIdx]?.label}
      </p>
      <div className="hidden sm:flex items-center justify-center gap-4 md:gap-6 flex-wrap">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center gap-4 md:gap-5 shrink-0">
            <div className="flex items-center gap-3 shrink-0">
              <div className={`w-11 h-11 md:w-12 md:h-12 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                i < activeIdx
                  ? "bg-[var(--brand-primary)] border-[var(--brand-primary)] text-white shadow-[0_0_18px_var(--glow-1)]"
                  : i === activeIdx
                    ? "border-[var(--brand-primary)] bg-[var(--void-tint)] shadow-[0_0_18px_var(--glow-1)]"
                    : "border-[var(--border-2)] bg-transparent"
              }`}>
                {i < activeIdx ? (
                  <svg width="14" height="14" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                ) : (
                  <span className={`font-stats text-base font-bold tabular-nums ${i === activeIdx ? "text-[var(--brand-primary)]" : "text-haze-3"}`}>{i + 1}</span>
                )}
              </div>
              <span className={`text-sm md:text-base font-semibold tracking-wide ${i === activeIdx ? "text-haze" : i < activeIdx ? "text-[var(--brand-primary)]" : "text-haze-3"}`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-10 md:w-20 h-[2px] rounded-full transition-all ${i < activeIdx ? "bg-[var(--brand-primary)]" : "bg-[var(--border-1)]"}`} />
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
      className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10 xl:gap-14 w-full"
    >
      <div className="flex flex-col gap-8 md:gap-10 min-w-0">
        <div className="flex flex-col gap-4 rounded-2xl bg-[var(--void-tint)] border border-[var(--border-accent)] px-7 py-7 md:px-9 md:py-8 shadow-sm">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
            <span className="font-mono text-xs sm:text-sm font-semibold text-[var(--brand-primary)] uppercase tracking-[2px]">Bounty entry fee</span>
            <span className="font-stats font-bold text-lg md:text-xl text-haze">{ENTRY_FEE} coins / player</span>
          </div>
          <span className="font-body text-base md:text-lg text-haze-2 leading-relaxed">{ENTRY_FEE_SUMMARY}</span>
          <span className="font-body text-sm md:text-base text-haze-3">{HOSTING_FREE_SUMMARY}</span>
        </div>

        <div>
          <label className="block font-mono text-xs sm:text-sm font-semibold uppercase tracking-[2px] text-haze-2 mb-4">Arena name</label>
          <input
            type="text"
            maxLength={60}
            placeholder="e.g. Friday Coding Battle"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-14 md:h-16 px-6 bg-[var(--surface-inset)] border border-[var(--border-2)] rounded-xl text-haze font-display text-lg md:text-xl placeholder:text-haze-3 focus:outline-none focus:border-[var(--brand-primary)] focus:shadow-[0_0_0_3px_var(--focus-ring)] transition-all"
          />
        </div>
      </div>

      <div className="flex flex-col gap-8 md:gap-10 min-w-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6 md:gap-7">
          <div>
            <label className="block font-mono text-xs sm:text-sm font-semibold uppercase tracking-[2px] text-haze-2 mb-4">Players (2–20)</label>
            <div className="flex items-center border border-[var(--border-2)] bg-[var(--surface-inset)] h-14 md:h-16 rounded-xl overflow-hidden">
              <button type="button" onClick={() => setPlayers((n) => Math.max(2, n - 1))} className="cursor-target w-14 h-full text-haze-2 hover:text-[var(--brand-primary)] hover:bg-[var(--surface-hover)] transition-colors font-semibold text-2xl">−</button>
              <span className="flex-1 text-center font-stats font-bold text-2xl md:text-3xl text-haze tabular-nums">{players}</span>
              <button type="button" onClick={() => setPlayers((n) => Math.min(20, n + 1))} className="cursor-target w-14 h-full text-haze-2 hover:text-[var(--brand-primary)] hover:bg-[var(--surface-hover)] transition-colors font-semibold text-2xl">+</button>
            </div>
            <p className="font-body text-sm md:text-base text-haze-3 mt-3 leading-relaxed">Max bounty pool: {maxBountyPool(players)} coins ({ENTRY_FEE} × competing players)</p>
          </div>
          <div>
            <label className="block font-mono text-xs sm:text-sm font-semibold uppercase tracking-[2px] text-haze-2 mb-4">Timer</label>
            <button type="button" onClick={() => setTimer(!timer)} role="switch" aria-checked={timer}
              className={`cursor-target w-full h-14 md:h-16 flex items-center justify-center gap-3 border rounded-xl text-base md:text-lg font-semibold transition-all ${timer ? "border-[var(--brand-primary)] text-[var(--brand-primary)] bg-[var(--void-tint)]" : "border-[var(--border-2)] text-haze-3"}`}>
              <span className={`w-3 h-3 rounded-full transition-colors ${timer ? "bg-[var(--brand-primary)]" : "bg-[var(--border-2)]"}`} aria-hidden />
              {timer ? "On" : "Off"}
            </button>
          </div>
        </div>

        {timer && (
          <div>
            <label className="block font-mono text-xs sm:text-sm font-semibold uppercase tracking-[2px] text-haze-2 mb-4">Duration — {timerMin} minutes</label>
            <input type="range" min={1} max={60} value={timerMin} onChange={(e) => setTimerMin(Number(e.target.value))} className="w-full h-2" style={{ accentColor: "var(--brand-primary)" }} />
            <div className="flex justify-between font-mono text-xs text-haze-3 mt-3"><span>1 min</span><span>60 min</span></div>
          </div>
        )}
      </div>

      {error && (
        <div className="lg:col-span-2">
          <p className="flex items-center gap-2 font-body text-base text-danger"><AlertCircle size={18} /> {error}</p>
        </div>
      )}

      <div className="lg:col-span-2">
        <StepActions>
          <Button variant="primary" size="lg" className="w-full sm:w-auto sm:min-w-[280px] h-14 text-base" magnetic onClick={handleNext}>
            Next — add questions <ChevronRight size={18} />
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
  const skipChangeRef = useRef(false);
  const prevTaskRef = useRef(q.taskRaw);

  useEffect(() => {
    prevTaskRef.current = q.taskRaw;
  }, [q.taskRaw]);

  function applyBulkPaste(lines: string[]) {
    skipChangeRef.current = true;
    onBulkPaste(lines, index);
    prevTaskRef.current = lines[0] ?? "";
  }

  return (
    <motion.div layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-card)] p-6 sm:p-8 md:p-10 lg:p-12 shadow-sm">
      <div className="flex items-center justify-between gap-4 mb-6 md:mb-7">
        <span className="font-mono text-xs sm:text-sm text-[var(--brand-primary)] tracking-widest uppercase">Question {index + 1}</span>
        <div className="flex items-center gap-3">
          {q.status === "done" && q.analysis?.valid && (
            <span className="font-mono text-[10px] sm:text-xs text-success tracking-wider uppercase">Ready</span>
          )}
          {q.status === "clarify" && (
            <span className="font-mono text-[10px] sm:text-xs text-crown tracking-wider uppercase">Needs input</span>
          )}
          {q.status === "invalid" && (
            <span className="font-mono text-[10px] sm:text-xs text-danger tracking-wider uppercase">Invalid</span>
          )}
          {total > 1 && (
            <button type="button" onClick={onDelete} className="cursor-target text-haze-3 hover:text-danger transition-colors p-2 rounded-lg hover:bg-[var(--surface-hover)]" aria-label="Remove question">
              <Trash2 size={20} />
            </button>
          )}
        </div>
      </div>

      <textarea
        rows={6}
        placeholder="Type your question here"
        value={q.taskRaw}
        onChange={(e) => {
          if (skipChangeRef.current) {
            skipChangeRef.current = false;
            return;
          }
          const next = e.target.value;
          if (looksLikeBulkQuestionInput(prevTaskRef.current, next)) {
            applyBulkPaste(parseBulkQuestions(next));
            return;
          }
          prevTaskRef.current = next;
          onChange(next);
        }}
        onPaste={(e) => {
          const lines = readClipboardQuestions(e.clipboardData);
          if (lines && lines.length >= 2) {
            e.preventDefault();
            e.stopPropagation();
            applyBulkPaste(lines);
            return;
          }
          const text = e.clipboardData.getData("text/plain");
          if (isBulkQuestionPaste(text)) {
            e.preventDefault();
            e.stopPropagation();
            applyBulkPaste(parseBulkQuestions(text));
          }
        }}
        disabled={q.status === "analyzing"}
        className="w-full min-h-[180px] px-5 py-4 sm:px-6 sm:py-5 bg-[var(--surface-inset)] border border-[var(--border-2)] text-haze font-body text-base md:text-lg placeholder:text-haze-3 focus:outline-none focus:border-[var(--brand-primary)] focus:shadow-[0_0_0_3px_var(--focus-ring)] transition-all resize-y disabled:opacity-50 rounded-xl"
      />

      {/* Error */}
      {q.error && <p className="font-body text-sm md:text-base text-danger mt-3">{q.error}</p>}
      {q.status === "invalid" && q.analysis && (
        <p className="font-body text-sm md:text-base text-danger mt-3">{q.analysis.invalidReason}</p>
      )}

      {/* Clarification needed */}
      {q.status === "clarify" && q.analysis && (
        <div className="mt-5 border border-crown/40 bg-crown/5 p-5 md:p-6 rounded-xl">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle size={18} className="text-crown shrink-0 mt-0.5" aria-hidden />
            <p className="font-body text-base md:text-lg text-haze leading-relaxed">{q.analysis.clarificationReason}</p>
          </div>

          {q.analysis.category === "coding" ? (
            <>
              <p className="font-mono text-xs text-haze-3 tracking-widest uppercase mb-3">
                Pick the language for this challenge
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {LANGUAGE_KEYS.map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setPickLang(k)}
                    className={`cursor-target font-mono text-sm px-4 py-2 border rounded-lg transition-all ${
                      pickLang === k
                        ? "border-[var(--brand-primary)] text-[var(--brand-primary)] bg-[var(--void-tint)]"
                        : "border-[var(--border-1)] text-haze-2 hover:text-haze hover:border-[var(--border-accent)]"
                    }`}
                  >
                    {LANGUAGES[k].label}
                  </button>
                ))}
              </div>
              <Button variant="primary" size="lg" fullWidth onClick={() => onAnalyze(pickLang)}>
                Build coding room in {LANGUAGES[pickLang].label}
              </Button>
            </>
          ) : (
            <>
              {q.analysis.suggestions && q.analysis.suggestions.length > 0 && (
                <ul className="mb-4 space-y-2">
                  {q.analysis.suggestions.map((s, i) => (
                    <li key={i} className="font-body text-base text-haze-2 flex gap-2">
                      <span className="text-crown">›</span> {s}
                    </li>
                  ))}
                </ul>
              )}
              <p className="font-body text-sm text-haze-3">
                Edit the question above to be more specific, then re-analyze.
              </p>
            </>
          )}
        </div>
      )}

      {/* Analysis preview */}
      {q.status === "done" && q.analysis?.valid && (
        <>
          <div className="mt-5 flex flex-wrap gap-3 items-center">
            <span className="font-mono text-xs sm:text-sm px-3 py-1.5 border rounded-lg" style={{ color: catColor, borderColor: `${catColor}55`, background: `${catColor}14` }}>
              {q.analysis.category.toUpperCase()}
            </span>
            <span className="font-mono text-xs sm:text-sm px-3 py-1.5 border rounded-lg" style={{ color: DIFF_COLORS[q.analysis.difficulty], borderColor: `${DIFF_COLORS[q.analysis.difficulty]}55`, background: `${DIFF_COLORS[q.analysis.difficulty]}14` }}>
              {q.analysis.difficulty.toUpperCase()}
            </span>
            <span className="font-display text-base sm:text-lg md:text-xl text-haze">&ldquo;{q.analysis.title}&rdquo;</span>
          </div>

          {q.analysis.category !== "coding" && (
            <div className="mt-6 border border-crown/40 bg-crown/5 p-5 md:p-6 rounded-xl">
              <label
                htmlFor={`answer-${q.localId}`}
                className="font-mono text-[11px] sm:text-xs text-crown tracking-widest uppercase block mb-3"
              >
                Correct answer (AI) — edit if wrong
              </label>
              <input
                id={`answer-${q.localId}`}
                type="text"
                value={q.analysis.canonicalAnswer ?? ""}
                onChange={(e) => onAnswerChange(e.target.value)}
                placeholder="The answer players must match"
                className="w-full h-14 px-5 bg-[var(--surface-inset)] border border-[var(--border-2)] text-haze font-body text-base md:text-lg focus:outline-none focus:border-crown transition-colors rounded-xl"
              />
              <p className="font-body text-sm md:text-base text-haze-2 mt-3 leading-relaxed">
                The AI fact-checks this answer. It must be one specific name, number, or fact — edit it if the AI got it wrong.
              </p>
            </div>
          )}

          {q.analysis.category === "coding" && (
            <div className="mt-5 border border-[var(--border-accent)] bg-[var(--void-tint)] p-5 md:p-6 rounded-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <span className="font-mono text-xs text-[var(--brand-primary)] tracking-widest uppercase">Coding environment</span>
                <select
                  value={q.analysis.language ?? "javascript"}
                  onChange={(e) => onAnalyze(e.target.value)}
                  className="bg-[var(--surface-inset)] border border-[var(--border-1)] text-haze-2 font-mono text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-[var(--brand-primary)]"
                  aria-label="Change language"
                >
                  {LANGUAGE_KEYS.map((k) => (
                    <option key={k} value={k}>{LANGUAGES[k].label}</option>
                  ))}
                </select>
              </div>
              <p className="font-body text-base text-haze-2 mb-2">
                Editor language: <span className="text-[var(--brand-primary)] font-semibold">{getLanguage(q.analysis.language).label}</span>
              </p>
              {q.analysis.ioFormat && (
                <p className="font-mono text-xs sm:text-sm text-haze-3 leading-relaxed mb-2">I/O: {q.analysis.ioFormat}</p>
              )}
              <p className="font-mono text-xs sm:text-sm text-haze-3">
                {q.analysis.publicTests?.length ?? 0} public + {q.analysis.hiddenTests?.length ?? 0} hidden tests · change the language to rebuild the room
              </p>
            </div>
          )}
        </>
      )}

      {showAnalyzeButton && (
      <button
        type="button"
        onClick={() => onAnalyze()}
        disabled={q.status === "analyzing" || !q.taskRaw.trim()}
        className={`cursor-target mt-5 w-full h-12 md:h-14 flex items-center justify-center gap-2 border rounded-xl font-mono text-xs sm:text-sm tracking-widest uppercase transition-all disabled:opacity-40 ${
          q.status === "done" && q.analysis?.valid
            ? "border-success/40 text-success bg-success/5 hover:bg-success/10"
            : "border-[var(--border-accent)] text-[var(--brand-primary)] bg-[var(--void-tint)] hover:bg-[var(--void-tint-hover)]"
        }`}
      >
        {q.status === "analyzing" ? (
          <><Loader2 size={16} className="animate-spin" /> Analyzing…</>
        ) : q.status === "done" && q.analysis?.valid ? (
          <>Re-analyze</>
        ) : (
          <>Analyze with AI</>
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
  const filledQuestions = questions.filter((q) => q.taskRaw.trim());
  const multi = filledQuestions.length > 1;
  const hasContent = filledQuestions.length > 0;

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="flex flex-col gap-12 md:gap-14 lg:gap-16">
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
            onBulkPaste={(lines, startIndex) => onBulkPaste(lines, startIndex)}
            onDelete={() => onDelete(q.localId)}
            onAnalyze={(hint) => onAnalyzeOne(q.localId, hint)}
            showAnalyzeButton
          />
        ))}
      </AnimatePresence>

      {multi && (
        <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={onAnalyzeAll}
            disabled={anyAnalyzing || !hasContent}
            loading={batchAnalyzing}
            className="gap-2 h-14 text-base"
          >
            {batchAnalyzing && analyzeProgress
              ? `Analyzing ${analyzeProgress.current} of ${analyzeProgress.total}…`
              : batchAnalyzing
                ? "Analyzing all questions…"
                : "Analyze all with AI"}
          </Button>
      )}

      {!multi && questions.length === 1 && questions[0].status !== "done" && (
        <p className="font-rajdhani text-base md:text-lg text-haze-3 text-center">Analyze your question before continuing.</p>
      )}

      {questions.length < 10 && (
        <button type="button" onClick={onAdd}
          className="cursor-target flex items-center justify-center gap-3 h-14 md:h-16 border-2 border-dashed border-[var(--border-1)] text-haze-3 hover:text-[var(--brand-primary)] hover:border-[var(--border-accent)] font-mono text-xs sm:text-sm tracking-widest uppercase transition-all rounded-xl">
          <Plus size={18} /> Add question ({questions.length}/10)
        </button>
      )}

      {!allValid && questions.length > 0 && (
        <p className="font-body text-base text-haze-3 text-center">
          Analyze all questions and confirm each has a specific correct answer before continuing
        </p>
      )}

      <StepActions>
        <Button variant="secondary" size="lg" onClick={onBack} className="w-full sm:flex-1 h-14">← Back</Button>
        <Button variant="primary" size="lg" onClick={onNext} disabled={!allValid || anyAnalyzing} className="w-full sm:flex-1 h-14">
          Review & launch →
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
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="flex flex-col gap-10 md:gap-12 lg:gap-14">
      <div className="bg-[var(--surface-inset)] border border-[var(--border-1)] p-6 md:p-8 lg:p-9 rounded-2xl shadow-sm">
        <p className="font-mono text-xs sm:text-sm text-[var(--brand-primary)] tracking-widest mb-5 uppercase">Arena summary</p>
        <div className="flex flex-col gap-3.5 font-body text-base md:text-lg">
          <div className="flex flex-wrap justify-between gap-4"><span className="text-haze-3">Name</span><span className="text-haze font-semibold text-right">{arenaName}</span></div>
          <div className="flex flex-wrap justify-between gap-4"><span className="text-haze-3">Questions</span><span className="text-haze font-semibold">{questions.length}</span></div>
          <div className="flex flex-wrap justify-between gap-4"><span className="text-haze-3">Entry fee</span><span className="text-coin-gold font-semibold">{ENTRY_FEE} coins / player → bounty</span></div>
          <div className="flex flex-wrap justify-between gap-4"><span className="text-haze-3">Max bounty pool</span><span className="font-stats text-coin-gold font-bold text-xl md:text-2xl">{maxPrizePool} coins</span></div>
          <p className="text-haze-3 text-sm md:text-base pt-4 border-t border-[var(--border-1)] mt-2 leading-relaxed">
            {HOSTING_FREE_SUMMARY} {ENTRY_FEE_SUMMARY}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-5 md:gap-6">
        {questions.map((q, i) => {
          const a = q.analysis!;
          const catColor = CAT_COLORS[a.category] ?? "#A78BFA";
          return (
            <div key={q.localId} className="bg-[var(--surface-inset)] border border-[var(--border-1)] p-5 sm:p-6 md:p-7 rounded-xl shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-3">
                <span className="font-mono text-xs sm:text-sm text-haze-3 uppercase tracking-widest">Q{i + 1}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] sm:text-xs px-2.5 py-1 border rounded-md" style={{ color: catColor, borderColor: `${catColor}55`, background: `${catColor}14` }}>
                    {a.category.toUpperCase()}
                  </span>
                  <span className="font-mono text-[10px] sm:text-xs font-semibold tracking-wider" style={{ color: DIFF_COLORS[a.difficulty] }}>
                    {a.difficulty.toUpperCase()}
                  </span>
                </div>
              </div>
              <p className="font-display text-lg md:text-xl text-haze mb-2 leading-snug">&ldquo;{a.title}&rdquo;</p>
              <p className="font-body text-base text-haze-2 line-clamp-3 leading-relaxed">{a.taskNormalised}</p>
              {a.category !== "coding" && a.canonicalAnswer && (
                <p className="font-mono text-xs sm:text-sm text-crown mt-3">
                  Answer: <span className="text-haze">{a.canonicalAnswer}</span>
                </p>
              )}
              {a.publicTests && <p className="font-mono text-xs sm:text-sm text-haze-3 mt-2">{a.publicTests.length} public · {a.hiddenTests?.length ?? 0} hidden tests</p>}
            </div>
          );
        })}
      </div>

      {createError && (
        <p className="flex items-center justify-center gap-2 font-body text-base text-danger text-center">
          <AlertCircle size={18} /> {createError}
        </p>
      )}

      <StepActions>
        <Button variant="secondary" size="lg" onClick={onBack} className="w-full sm:flex-1 h-14">← Back</Button>
        <Button variant="primary" size="lg" onClick={onLaunch} disabled={creating} loading={creating} className="w-full sm:flex-1 h-14 text-base">
          {creating ? "Creating…" : "Create arena (free) →"}
        </Button>
      </StepActions>
    </motion.div>
  );
}

/* ─── Lobby view ─── */
function LobbyView({ room }: { room: CreatedRoom }) {
  const router = useRouter();

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-10 md:gap-12 max-w-2xl mx-auto w-full">
      <div className="text-center py-6 md:py-8">
        <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-haze mb-3 leading-tight">Arena created</h2>
        <p className="font-stats font-bold text-xl md:text-2xl text-[var(--brand-primary)]">{room.name}</p>
        <p className="font-mono text-xs sm:text-sm text-success mt-4 tracking-widest uppercase">Lobby ready</p>
      </div>

      <div>
        <p className="font-mono text-xs sm:text-sm text-haze-3 tracking-widest mb-5 uppercase">Invite friends</p>
        <InviteSharePanel roomId={room.id} qrSize={160} />
      </div>

      <div className="flex flex-col gap-4 mt-2">
        <Button variant="primary" size="lg" fullWidth magnetic className="h-14 text-base" onClick={() => router.push(`/lobby/${room.id}`)}>
          Enter lobby →
        </Button>
        <button type="button" onClick={() => router.push("/dashboard")} className="font-body text-base text-haze-3 hover:text-[var(--brand-primary)] transition-colors text-center py-3">
          Go to dashboard
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

  const handleBulkPaste = useCallback((lines: string[], startIndex: number) => {
    if (lines.length < 2) return;
    setQuestions((prev) => mergeBulkPaste(prev, lines, startIndex));
  }, []);

  const runAnalyzeRequest = useCallback(async (
    localId: string,
    taskRaw: string,
    languageHint?: string,
  ): Promise<{ ok: boolean; rateLimited: boolean }> => {
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
        return { ok: false, rateLimited: isAiRateLimitError(error) };
      }

      const data = (await res.json()) as { analysis?: AIAnalysis };
      if (!data.analysis) {
        setQuestions((prev) => prev.map((x) => (x.localId === localId ? { ...x, status: "error", error: "Invalid response from server" } : x)));
        return { ok: false, rateLimited: false };
      }

      applyAnalysisResult(localId, data.analysis);
      return { ok: true, rateLimited: false };
    } catch (err) {
      const message =
        err instanceof TypeError
          ? "Network error — check your connection and try again"
          : "Could not reach AI service";
      setQuestions((prev) => prev.map((x) => (x.localId === localId ? { ...x, status: "error", error: message } : x)));
      return { ok: false, rateLimited: false };
    }
  }, [applyAnalysisResult, setupData?.name]);

  const handleAnalyzeOne = useCallback(async (localId: string, languageHint?: string) => {
    const q = questions.find((x) => x.localId === localId);
    if (!q || !q.taskRaw.trim()) return;
    await runAnalyzeRequest(localId, q.taskRaw, languageHint);
  }, [questions, runAnalyzeRequest]);

  const handleAnalyzeAll = useCallback(async () => {
    const pending = questions.filter((q) => q.taskRaw.trim());
    if (pending.length === 0) return;

    setBatchAnalyzing(true);
    setAnalyzeProgress({ current: 0, total: pending.length });

    try {
      for (let i = 0; i < pending.length; i++) {
        const q = pending[i];
        setAnalyzeProgress({ current: i + 1, total: pending.length });

        let attempts = 0;
        while (attempts < 3) {
          const result = await runAnalyzeRequest(q.localId, q.taskRaw);
          if (result.ok) break;
          if (result.rateLimited) {
            await sleep(8_000 * (attempts + 1));
            attempts++;
            continue;
          }
          break;
        }

        if (i < pending.length - 1) {
          await sleep(6_500);
        }
      }
    } finally {
      setBatchAnalyzing(false);
      setAnalyzeProgress(null);
    }
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
      <AppPage className="max-w-none">
        <p className="font-mono text-xs sm:text-sm font-semibold uppercase tracking-[3px] text-[var(--brand-primary)] mb-4">New arena</p>
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-haze mb-5 md:mb-7 text-balance leading-[1.05]">Create your arena</h1>
        <p className="font-body text-lg md:text-xl lg:text-2xl text-haze-2 mb-12 md:mb-16 max-w-3xl leading-relaxed">
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
