"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Copy, AlertCircle } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

type Step = "define" | "analyzing" | "review" | "lobby";
type Category = "coding" | "trivia" | "logic" | "math" | "writing" | "design" | "meme";
type Difficulty = "rookie" | "challenger" | "elite" | "legendary";
type BountyTier = "bronze" | "silver" | "gold" | "mythic";

type AIAnalysis = {
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
};

type CreatedRoom = {
  id: string;
  name: string;
  status: string;
};

function StepIndicator({ step }: { step: Step }) {
  const steps = [
    { id: "define",  label: "DEFINE"  },
    { id: "review",  label: "REVIEW"  },
    { id: "lobby",   label: "LAUNCH"  },
  ];
  const activeIdx =
    step === "define" || step === "analyzing" ? 0 : step === "review" ? 1 : 2;

  return (
    <div className="flex items-center gap-0 mb-12">
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center">
          <div className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                i < activeIdx
                  ? "bg-success border-success"
                  : i === activeIdx
                  ? "border-void bg-void/20"
                  : "border-cosmos-4 bg-transparent"
              }`}
            >
              {i < activeIdx ? (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                  <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <span className={`font-space-mono text-[9px] font-bold ${i === activeIdx ? "text-void" : "text-haze-3"}`}>
                  {i + 1}
                </span>
              )}
            </div>
            <span className={`font-space-mono text-[10px] tracking-[3px] ${i === activeIdx ? "text-void" : i < activeIdx ? "text-success" : "text-haze-3"}`}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`w-8 sm:w-16 h-px mx-2 sm:mx-3 transition-all ${i < activeIdx ? "bg-success" : "bg-cosmos-4"}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function DefineStep({
  onSubmit,
}: {
  onSubmit: (data: { name: string; taskRaw: string; playerCap: number; timerSeconds?: number }) => void;
}) {
  const [name, setName] = useState("");
  const [task, setTask] = useState("");
  const [timer, setTimer] = useState(true);
  const [timerMin, setTimerMin] = useState(10);
  const [players, setPlayers] = useState(4);
  const [error, setError] = useState("");

  function handleSubmit() {
    if (!name.trim()) { setError("Arena name is required"); return; }
    if (!task.trim())  { setError("Challenge description is required"); return; }
    setError("");
    onSubmit({
      name: name.trim(),
      taskRaw: task.trim(),
      playerCap: players,
      timerSeconds: timer ? timerMin * 60 : undefined,
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className="flex flex-col gap-6"
    >
      <div>
        <label className="block font-space-mono text-[11px] text-void tracking-[3px] mb-2 uppercase">Arena Name</label>
        <input
          type="text"
          maxLength={60}
          placeholder="e.g. Friday Coding Battle"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full h-12 px-4 bg-cosmos-2 border border-cosmos-4 text-haze font-rajdhani text-base placeholder:text-haze-3 focus:outline-none focus:border-void focus:shadow-[0_0_0_2px_rgba(168,85,247,0.2)] transition-all"
          style={{ borderRadius: 0 }}
        />
      </div>

      <div>
        <label className="block font-space-mono text-[11px] text-void tracking-[3px] mb-2 uppercase">Drop Your Challenge</label>
        <textarea
          rows={7}
          placeholder={`Paste your challenge here. It can be anything:\n→ Build a function that reverses a string\n→ Who invented the telephone?\n→ What's 847 × 23?\n→ Name 5 African capitals in 60 seconds`}
          value={task}
          onChange={(e) => setTask(e.target.value)}
          className="w-full px-4 py-3 bg-cosmos-2 border border-cosmos-4 text-haze font-rajdhani text-base placeholder:text-haze-3 focus:outline-none focus:border-void focus:shadow-[0_0_0_2px_rgba(168,85,247,0.2)] transition-all resize-none"
          style={{ borderRadius: 0 }}
        />
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div>
          <label className="block font-space-mono text-[11px] text-void tracking-[3px] mb-2 uppercase">Players (2–20)</label>
          <div className="flex items-center border border-cosmos-4 bg-cosmos-2 h-12">
            <button
              type="button"
              onClick={() => setPlayers((n) => Math.max(2, n - 1))}
              className="cursor-target w-12 h-full text-haze-2 hover:text-void hover:bg-cosmos-3 transition-colors font-bold text-lg"
              aria-label="Decrease players"
            >−</button>
            <span className="flex-1 text-center font-orbitron font-bold text-lg text-haze">{players}</span>
            <button
              type="button"
              onClick={() => setPlayers((n) => Math.min(20, n + 1))}
              className="cursor-target w-12 h-full text-haze-2 hover:text-void hover:bg-cosmos-3 transition-colors font-bold text-lg"
              aria-label="Increase players"
            >+</button>
          </div>
        </div>

        <div>
          <label className="block font-space-mono text-[11px] text-void tracking-[3px] mb-2 uppercase">Timer</label>
          <button
            type="button"
            onClick={() => setTimer(!timer)}
            role="switch"
            aria-checked={timer}
            className={`cursor-target w-full h-12 flex items-center justify-center gap-2 border font-space-mono text-xs tracking-widest transition-all ${
              timer ? "border-void text-void bg-void/10" : "border-cosmos-4 text-haze-3"
            }`}
          >
            <span className={`w-3 h-3 rounded-full transition-colors ${timer ? "bg-void" : "bg-cosmos-4"}`} aria-hidden />
            {timer ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      {timer && (
        <div>
          <label className="block font-space-mono text-[11px] text-void tracking-[3px] mb-2 uppercase">
            Duration — {timerMin} minutes
          </label>
          <input
            type="range"
            min={1}
            max={60}
            value={timerMin}
            onChange={(e) => setTimerMin(Number(e.target.value))}
            className="w-full accent-violet-500"
          />
          <div className="flex justify-between font-space-mono text-[9px] text-haze-3 mt-1">
            <span>1 min</span><span>60 min</span>
          </div>
        </div>
      )}

      {error && (
        <p className="flex items-center gap-2 font-rajdhani text-sm text-danger">
          <AlertCircle size={14} /> {error}
        </p>
      )}

      <Button variant="primary" size="lg" fullWidth magnetic onClick={handleSubmit}>
        ANALYSE WITH AI →
      </Button>
    </motion.div>
  );
}

function AnalyzingStep({ analysisError }: { analysisError: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-cosmos border border-void/25 p-6 font-space-mono text-sm"
    >
      {analysisError ? (
        <div className="text-center py-4">
          <p className="text-danger text-base font-bold mb-2">AI ANALYSIS FAILED</p>
          <p className="text-haze-2 text-sm">{analysisError}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {[
            "> Analysing challenge...",
            "> Checking validity...",
            "> Detecting category...",
            "> Generating title...",
            "> Building test suite...",
            "> ✓ Preparing arena...",
          ].map((line, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.4 }}
              className={`leading-7 ${line.includes("✓") ? "text-success font-bold" : "text-haze-2"}`}
            >
              {line}
              {i === 5 && <span className="cursor-blink ml-0.5 text-void">▌</span>}
            </motion.p>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function ReviewStep({
  analysis,
  onBountyChange,
  bountyTier,
  onLaunch,
  creating,
  createError,
}: {
  analysis: AIAnalysis;
  onBountyChange: (t: BountyTier) => void;
  bountyTier: BountyTier;
  onLaunch: () => void;
  creating: boolean;
  createError: string;
}) {
  const CATEGORY_COLORS: Record<string, string> = {
    coding: "#FF6B1A", trivia: "#9B6BFF", logic: "#00D68F", math: "#F0A500",
    writing: "#9B8FC0", design: "#C084FC", meme: "#F472B6",
  };
  const catColor = CATEGORY_COLORS[analysis.category] ?? "#9B8FC0";

  if (!analysis.valid) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-5"
      >
        <div className="bg-cosmos-2 clip-arena p-6 border border-danger/30">
          <p className="font-orbitron font-bold text-danger mb-2">INVALID CHALLENGE</p>
          <p className="font-rajdhani text-haze-2 text-sm">{analysis.invalidReason}</p>
        </div>
        <p className="font-space-mono text-[10px] text-haze-3">Please go back and revise your challenge.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className="flex flex-col gap-6"
    >
      {/* AI result card */}
      <div className="bg-cosmos-2 clip-arena p-6" style={{ border: "1px solid rgba(155,107,255,0.3)" }}>
        <span className="font-space-mono text-[10px] text-void tracking-widest uppercase bg-void/10 border border-void/30 px-3 py-1 inline-block mb-5">
          AI ANALYSIS
        </span>
        <div className="flex flex-col gap-3 font-space-mono text-sm">
          <Row label="CATEGORY" value={
            <span className="px-2 py-0.5 border" style={{ color: catColor, borderColor: `${catColor}44`, background: `${catColor}11` }}>
              {analysis.category.toUpperCase()}
            </span>
          } />
          <Row label="TITLE" value={<span className="text-haze font-rajdhani font-bold text-base">{analysis.title}</span>} />
          <Row label="DIFFICULTY" value={<span className="text-crown">{analysis.difficulty.toUpperCase()}</span>} />
          <Row label="VALIDITY" value={<span className="text-success">✓ VALID CHALLENGE</span>} />
        </div>
      </div>

      {/* Normalised brief */}
      <div className="bg-cosmos border border-cosmos-4 p-5">
        <p className="font-space-mono text-[10px] text-void tracking-widest mb-3 uppercase">Challenge Brief</p>
        <p className="font-rajdhani text-base text-haze leading-relaxed">{analysis.taskNormalised}</p>
      </div>

      {/* Starter code preview (coding only) */}
      {analysis.starterCode && (
        <div className="bg-cosmos border border-cosmos-4 p-5">
          <p className="font-space-mono text-[10px] text-void tracking-widest mb-3 uppercase">Starter Code</p>
          <pre className="font-space-mono text-xs text-haze-2 overflow-x-auto">{analysis.starterCode}</pre>
        </div>
      )}

      {/* Public tests preview */}
      {analysis.publicTests && analysis.publicTests.length > 0 && (
        <div className="bg-cosmos border border-cosmos-4 p-5">
          <p className="font-space-mono text-[10px] text-void tracking-widest mb-3 uppercase">
            Public Tests ({analysis.publicTests.length}) · {analysis.hiddenTests?.length ?? 0} hidden
          </p>
          <div className="flex flex-col gap-2">
            {analysis.publicTests.slice(0, 3).map((t, i) => (
              <div key={i} className="font-space-mono text-xs text-haze-2">
                <span className="text-haze-3">in:</span> {t.input || '""'}
                {"  "}
                <span className="text-haze-3">out:</span> {t.expectedOutput}
              </div>
            ))}
            {analysis.publicTests.length > 3 && (
              <p className="font-space-mono text-[10px] text-haze-3">+ {analysis.publicTests.length - 3} more</p>
            )}
          </div>
        </div>
      )}

      {/* Bounty tier */}
      <div>
        <p className="font-space-mono text-[10px] text-haze-3 tracking-widest mb-3 uppercase">Bounty Tier</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(["bronze", "silver", "gold", "mythic"] as BountyTier[]).map((tier, i) => (
            <button
              key={tier}
              onClick={() => onBountyChange(tier)}
              className={`cursor-target p-3 border text-center transition-all clip-arena-sm ${
                bountyTier === tier ? "border-void bg-void/10" : "border-cosmos-4 hover:border-void/50"
              }`}
            >
              <p className="font-orbitron font-bold text-sm text-haze capitalize">{tier}</p>
              <p className="font-space-mono text-[9px] text-haze-3 mt-0.5">
                {["50 coins", "100 coins", "150 coins", "400 coins"][i]}
              </p>
            </button>
          ))}
        </div>
      </div>

      {createError && (
        <p className="flex items-center gap-2 font-rajdhani text-sm text-danger">
          <AlertCircle size={14} /> {createError}
        </p>
      )}

      <Button variant="primary" size="lg" fullWidth magnetic onClick={onLaunch} disabled={creating}>
        {creating ? "CREATING ARENA…" : "OPEN LOBBY →"}
      </Button>
    </motion.div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-[10px] text-haze-3 tracking-widest w-24 shrink-0">{label}</span>
      <span className="text-haze-2">{value}</span>
    </div>
  );
}

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
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6"
    >
      <div className="text-center">
        <h2 className="font-orbitron font-black text-3xl text-haze mb-1">ARENA LOBBY</h2>
        <p className="font-rajdhani font-bold text-lg text-void">{room.name}</p>
        <p className="font-space-mono text-[10px] text-success mt-2 tracking-widest">✓ ARENA CREATED</p>
      </div>

      <div>
        <p className="font-space-mono text-[10px] text-haze-3 tracking-widest mb-2 uppercase">Invite Link</p>
        <div className="flex items-center gap-0 border border-cosmos-4">
          <span className="flex-1 font-space-mono text-xs text-haze-2 px-3 py-3 bg-cosmos-2 truncate">
            {inviteLink}
          </span>
          <button
            onClick={copy}
            className={`cursor-target flex items-center gap-2 px-4 py-3 border-l border-cosmos-4 font-space-mono text-xs transition-colors ${
              copied ? "text-success bg-success/10" : "text-void hover:bg-void/10"
            }`}
            aria-label="Copy invite link"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "COPIED!" : "COPY"}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 mt-2">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          magnetic
          onClick={() => router.push(`/arena/${room.id}`)}
        >
          ENTER ARENA →
        </Button>
        <button
          onClick={() => router.push("/dashboard")}
          className="font-space-mono text-[11px] text-haze-3 hover:text-void transition-colors text-center py-2"
        >
          Go to Dashboard
        </button>
      </div>
    </motion.div>
  );
}

export default function CreatePage() {
  const [step, setStep] = useState<Step>("define");
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [bountyTier, setBountyTier] = useState<BountyTier>("bronze");
  const [analysisError, setAnalysisError] = useState("");
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);
  const [createdRoom, setCreatedRoom] = useState<CreatedRoom | null>(null);

  // Store define form data for room creation
  const defineDataRef = useRef<{
    name: string;
    taskRaw: string;
    playerCap: number;
    timerSeconds?: number;
  } | null>(null);

  const handleDefineSubmit = useCallback(async (data: typeof defineDataRef.current) => {
    if (!data) return;
    defineDataRef.current = data;
    setAnalysisError("");
    setStep("analyzing");

    try {
      const res = await fetchWithAuth("/api/rooms/analyse", {
        method: "POST",
        body: JSON.stringify({ taskRaw: data.taskRaw, arenaName: data.name }),
      });

      if (!res.ok) {
        const err = await res.json();
        setAnalysisError(err.error ?? "AI analysis failed");
        return;
      }

      const { analysis: aiResult } = await res.json();
      setAnalysis(aiResult);
      setStep("review");
    } catch {
      setAnalysisError("Could not reach the AI service. Please try again.");
    }
  }, []);

  const handleLaunch = useCallback(async () => {
    if (!analysis || !defineDataRef.current) return;
    setCreating(true);
    setCreateError("");

    try {
      const res = await fetchWithAuth("/api/rooms", {
        method: "POST",
        body: JSON.stringify({
          name:            defineDataRef.current.name,
          taskRaw:         defineDataRef.current.taskRaw,
          playerCap:       defineDataRef.current.playerCap,
          timerSeconds:    defineDataRef.current.timerSeconds,
          bountyTier,
          taskNormalised:  analysis.taskNormalised,
          canonicalAnswer: analysis.canonicalAnswer,
          category:        analysis.category,
          title:           analysis.title,
          difficulty:      analysis.difficulty,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setCreateError(err.error ?? "Failed to create room");
        return;
      }

      const { room } = await res.json();

      // If coding room, save test cases
      if (analysis.category === "coding" && (analysis.publicTests || analysis.hiddenTests)) {
        const allTests = [
          ...(analysis.publicTests ?? []).map((t) => ({ ...t, isHidden: false })),
          ...(analysis.hiddenTests ?? []).map((t) => ({ ...t, isHidden: true })),
        ];
        if (allTests.length > 0) {
          await fetchWithAuth(`/api/rooms/${room.id}/testcases`, {
            method: "POST",
            body: JSON.stringify({ tests: allTests }),
          });
        }
      }

      setCreatedRoom(room);
      setStep("lobby");
    } catch {
      setCreateError("Something went wrong. Please try again.");
    } finally {
      setCreating(false);
    }
  }, [analysis, bountyTier]);

  return (
    <AppLayout>
      <div className="px-5 md:px-8 lg:px-10 py-8 md:py-12 max-w-2xl mx-auto">
        <p className="font-space-mono text-[11px] text-void tracking-[3px] uppercase mb-2">New arena</p>
        <h1 className="font-zen-dots text-2xl md:text-3xl text-haze mb-2">Create your arena</h1>
        <p className="font-rajdhani text-base text-haze-2 mb-10">Drop any challenge. The AI builds the rest.</p>

        <StepIndicator step={step} />

        <AnimatePresence mode="wait">
          {step === "define" && (
            <DefineStep key="define" onSubmit={handleDefineSubmit} />
          )}
          {step === "analyzing" && (
            <AnalyzingStep key="analyzing" analysisError={analysisError} />
          )}
          {step === "review" && analysis && (
            <ReviewStep
              key="review"
              analysis={analysis}
              bountyTier={bountyTier}
              onBountyChange={setBountyTier}
              onLaunch={handleLaunch}
              creating={creating}
              createError={createError}
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
