"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Copy } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { useTypewriter } from "@/hooks/useTypewriter";

type Step = "define" | "analyzing" | "review" | "lobby";

const AI_LINES = [
  "> Analysing challenge...",
  "> Category detected: CODING",
  "> Difficulty: CHALLENGER",
  "> Generating title...",
  '> Title: "String Reversal Clash"',
  "> Generating 5 public tests...",
  "> Generating 20 hidden tests...",
  "> Self-validating test suite...",
  "> ✓ All systems valid",
  "> ARENA READY",
];

function StepIndicator({ step }: { step: Step }) {
  const steps: { id: Step | "lobby"; label: string }[] = [
    { id: "define", label: "DEFINE" },
    { id: "review", label: "REVIEW" },
    { id: "lobby",  label: "LAUNCH" },
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
                  ? "border-ignite bg-ignite/20"
                  : "border-cosmos-4 bg-transparent"
              }`}
            >
              {i < activeIdx ? (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                  <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <span
                  className={`font-share-mono text-[9px] font-bold ${
                    i === activeIdx ? "text-ignite" : "text-haze-3"
                  }`}
                >
                  {i + 1}
                </span>
              )}
            </div>
            <span
              className={`font-share-mono text-[10px] tracking-[3px] ${
                i === activeIdx ? "text-ignite" : i < activeIdx ? "text-success" : "text-haze-3"
              }`}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`w-16 h-px mx-3 transition-all ${i < activeIdx ? "bg-success" : "bg-cosmos-4"}`}
              style={{
                background: i < activeIdx ? "var(--success)" : i === activeIdx ? "var(--ignite)" : undefined,
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function AnalysisTerminal({ onDone }: { onDone: () => void }) {
  const { displayedLines, done } = useTypewriter(AI_LINES, 35, 200);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-cosmos border border-ignite/25 p-6 font-share-mono text-sm"
    >
      {displayedLines.map((line, i) => {
        const isLast = i === AI_LINES.length - 1;
        const isValid = line.includes("✓");
        return (
          <p
            key={i}
            className={`leading-7 ${
              isLast ? "text-ignite text-base font-bold" : isValid ? "text-success" : "text-haze-2"
            }`}
          >
            {line}
            {i === displayedLines.length - 1 && !done && (
              <span className="cursor-blink ml-0.5 text-ignite">▌</span>
            )}
          </p>
        );
      })}
      {done && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <Button variant="primary" size="md" magnetic onClick={onDone}>
            REVIEW ARENA →
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}

function DefineStep({ onSubmit }: { onSubmit: () => void }) {
  const [timer, setTimer] = useState(true);
  const [players, setPlayers] = useState(4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className="flex flex-col gap-6"
    >
      {/* Arena name */}
      <div>
        <label className="block font-share-mono text-[11px] text-ignite tracking-[3px] mb-2 uppercase">
          Arena Name
        </label>
        <input
          type="text"
          maxLength={60}
          placeholder="e.g. Friday Coding Battle"
          className="w-full h-12 px-4 bg-cosmos-2 border border-cosmos-4 text-haze font-rajdhani text-base
                     placeholder:text-haze-3 focus:outline-none focus:border-ignite
                     focus:shadow-[0_0_0_2px_rgba(255,107,26,0.2)] transition-all"
          style={{ borderRadius: 0 }}
        />
      </div>

      {/* Challenge textarea */}
      <div>
        <label className="block font-share-mono text-[11px] text-ignite tracking-[3px] mb-2 uppercase">
          Drop Your Challenge
        </label>
        <textarea
          rows={7}
          placeholder={`Paste your challenge here. It can be anything:\n→ Build a function that reverses a string\n→ Who invented the telephone?\n→ What's 847 × 23?\n→ Name 5 African capitals in 60 seconds`}
          className="w-full px-4 py-3 bg-cosmos-2 border border-cosmos-4 text-haze font-rajdhani text-base
                     placeholder:text-haze-3 focus:outline-none focus:border-ignite
                     focus:shadow-[0_0_0_2px_rgba(255,107,26,0.2)] transition-all resize-none"
          style={{ borderRadius: 0 }}
        />
      </div>

      {/* Players + Timer row */}
      <div className="grid grid-cols-2 gap-5">
        {/* Players */}
        <div>
          <label className="block font-share-mono text-[11px] text-ignite tracking-[3px] mb-2 uppercase">
            Players (2–20)
          </label>
          <div className="flex items-center border border-cosmos-4 bg-cosmos-2 h-12">
            <button
              type="button"
              onClick={() => setPlayers((n) => Math.max(2, n - 1))}
              className="w-12 h-full text-haze-2 hover:text-ignite hover:bg-cosmos-3 transition-colors font-bold text-lg"
              aria-label="Decrease players"
            >
              −
            </button>
            <span className="flex-1 text-center font-orbitron font-bold text-lg text-haze">
              {players}
            </span>
            <button
              type="button"
              onClick={() => setPlayers((n) => Math.min(20, n + 1))}
              className="w-12 h-full text-haze-2 hover:text-ignite hover:bg-cosmos-3 transition-colors font-bold text-lg"
              aria-label="Increase players"
            >
              +
            </button>
          </div>
        </div>

        {/* Timer */}
        <div>
          <label className="block font-share-mono text-[11px] text-ignite tracking-[3px] mb-2 uppercase">
            Timer
          </label>
          <button
            type="button"
            onClick={() => setTimer(!timer)}
            role="switch"
            aria-checked={timer}
            className={`w-full h-12 flex items-center justify-center gap-2 border font-share-mono text-xs tracking-widest transition-all ${
              timer ? "border-ignite text-ignite bg-ignite/10" : "border-cosmos-4 text-haze-3"
            }`}
          >
            <span
              className={`w-3 h-3 rounded-full transition-colors ${timer ? "bg-ignite" : "bg-cosmos-4"}`}
              aria-hidden="true"
            />
            {timer ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      <Button variant="primary" size="lg" fullWidth magnetic onClick={onSubmit}>
        ANALYSE WITH AI →
      </Button>
    </motion.div>
  );
}

function ReviewStep({ onLaunch }: { onLaunch: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className="flex flex-col gap-6"
    >
      {/* AI result card */}
      <div className="bg-cosmos-2 border-l-[3px] border-void p-6">
        <span className="font-share-mono text-[10px] text-void tracking-widest uppercase bg-void/10 border border-void/30 px-3 py-1 inline-block mb-5">
          AI ANALYSIS
        </span>
        <div className="flex flex-col gap-3 font-share-mono text-sm">
          <Row label="CATEGORY" value={<span className="text-ignite border border-ignite/30 bg-ignite/10 px-2 py-0.5">CODING</span>} />
          <Row label="TITLE" value={<span className="text-haze font-rajdhani font-bold text-base">String Reversal Clash</span>} />
          <Row label="DIFFICULTY" value={<span className="text-crown">CHALLENGER</span>} />
          <Row label="VALIDITY" value={<span className="text-success">✓ VALID CHALLENGE</span>} />
        </div>
      </div>

      {/* Challenge brief */}
      <div className="bg-cosmos border border-cosmos-4 p-5">
        <p className="font-share-mono text-[10px] text-ignite tracking-widest mb-3 uppercase">Challenge Brief</p>
        <p className="font-rajdhani text-base text-haze leading-relaxed">
          Write a function <code className="text-ignite bg-cosmos-2 px-1">reverseString(s)</code> that takes a string{" "}
          <code className="text-ignite bg-cosmos-2 px-1">s</code> and returns it reversed. The function must handle
          empty strings and single-character strings correctly.
        </p>
      </div>

      {/* Bounty tier */}
      <div>
        <p className="font-share-mono text-[10px] text-haze-3 tracking-widest mb-3 uppercase">Bounty Tier</p>
        <div className="grid grid-cols-4 gap-3">
          {["Bronze", "Silver", "Gold", "Mythic"].map((tier, i) => (
            <button
              key={tier}
              className={`p-3 border text-center transition-all ${
                i === 0 ? "border-ignite bg-ignite/10 scale-[1.02]" : "border-cosmos-4 hover:border-ignite/50"
              }`}
            >
              <p className="font-orbitron font-bold text-sm text-haze">{tier}</p>
              <p className="font-share-mono text-[9px] text-haze-3 mt-0.5">
                {i === 0 ? "FREE" : `${[50, 150, 500][i - 1]} coins`}
              </p>
            </button>
          ))}
        </div>
      </div>

      <Button variant="primary" size="lg" fullWidth magnetic onClick={onLaunch}>
        OPEN LOBBY →
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

export default function CreatePage() {
  const [step, setStep] = useState<Step>("define");

  return (
    <AppLayout>
      <div className="px-6 lg:px-10 py-12 max-w-2xl">
        <h1 className="font-orbitron font-bold text-4xl text-haze mb-2">CREATE YOUR ARENA</h1>
        <p className="font-rajdhani text-base text-haze-2 mb-10">Drop any challenge. AI does the rest.</p>

        <StepIndicator step={step} />

        <AnimatePresence mode="wait">
          {step === "define" && (
            <DefineStep key="define" onSubmit={() => setStep("analyzing")} />
          )}
          {step === "analyzing" && (
            <AnalysisTerminal key="analyzing" onDone={() => setStep("review")} />
          )}
          {step === "review" && (
            <ReviewStep key="review" onLaunch={() => setStep("lobby")} />
          )}
          {step === "lobby" && (
            <LobbyView key="lobby" />
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}

function LobbyView() {
  const SLOTS = Array.from({ length: 4 });
  const FILLED = [
    { name: "arena_player", initials: "AP", ready: true },
    { name: "zainab_codes", initials: "ZC", ready: false },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6"
    >
      <div className="text-center">
        <h2 className="font-orbitron font-black text-3xl text-haze mb-1">ARENA LOBBY</h2>
        <p className="font-rajdhani font-bold text-lg text-ignite">String Reversal Clash</p>
      </div>

      {/* Player slots */}
      <div className="grid grid-cols-2 gap-4">
        {SLOTS.map((_, i) => {
          const p = FILLED[i];
          return (
            <div
              key={i}
              className={`flex items-center gap-3 p-4 border ${
                p ? "border-cosmos-4 bg-cosmos-2" : "border-dashed border-cosmos-4 bg-transparent"
              }`}
            >
              {p ? (
                <>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                      p.ready ? "border-success" : "border-crown"
                    }`}
                  >
                    <span className="font-orbitron font-bold text-sm text-haze">{p.initials}</span>
                  </div>
                  <div>
                    <p className="font-rajdhani font-semibold text-sm text-haze">@{p.name}</p>
                    <span
                      className={`font-share-mono text-[9px] ${p.ready ? "text-success" : "text-crown"}`}
                    >
                      {p.ready ? "READY" : "WAITING"}
                    </span>
                  </div>
                </>
              ) : (
                <p className="font-share-mono text-[10px] text-haze-3 tracking-widest">
                  WAITING FOR PLAYER...
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Invite link */}
      <InviteLink />

      <Button variant="primary" size="lg" fullWidth magnetic>
        CONFIRM READY
      </Button>
    </motion.div>
  );
}

function InviteLink() {
  const [copied, setCopied] = useState(false);
  const link = "https://bountixx.com/room/abc123";

  const copy = async () => {
    await navigator.clipboard.writeText(link).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <p className="font-share-mono text-[10px] text-haze-3 tracking-widest mb-2 uppercase">Invite Rivals</p>
      <div className="flex items-center gap-0 border border-cosmos-4">
        <span className="flex-1 font-share-mono text-xs text-haze-2 px-3 py-3 bg-cosmos-2 truncate">
          {link}
        </span>
        <button
          onClick={copy}
          className={`flex items-center gap-2 px-4 py-3 border-l border-cosmos-4 font-share-mono text-xs transition-colors ${
            copied ? "text-success bg-success/10" : "text-ignite hover:bg-ignite/10"
          }`}
          aria-label="Copy invite link"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "COPIED!" : "COPY"}
        </button>
      </div>
    </div>
  );
}
