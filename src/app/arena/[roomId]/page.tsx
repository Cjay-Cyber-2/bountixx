"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Play, Upload, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { useArenaGuard } from "@/hooks/useArenaGuard";
import { useToast } from "@/components/ui/Toast";

/* ─── Timer ─── */
function Timer({ seconds }: { seconds: number }) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const critical = seconds < 30 && seconds > 0;

  return (
    <motion.span
      className="font-orbitron font-bold text-2xl tabular-nums"
      style={{ color: critical ? "var(--danger)" : "var(--void)" }}
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
const INITIAL_FEED = [
  { type: "typing",   player: "zainab_codes", text: "is typing..." },
  { type: "submitted", player: "dev_tolu",    text: "submitted a solution" },
  { type: "failed",   player: "code_chief",   text: "failed a test" },
];

function ActivityFeed() {
  const [items, setItems] = useState(INITIAL_FEED);

  return (
    <div className="bg-cosmos-2 border border-cosmos-4 p-4 h-full">
      <p className="font-space-mono text-[10px] text-void tracking-widest mb-4 uppercase">
        Arena Activity
      </p>
      <AnimatePresence initial={false}>
        {items.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 mb-3"
          >
            <span
              className={`font-space-mono text-[10px] shrink-0 ${
                item.type === "submitted" ? "text-crown" : item.type === "failed" ? "text-danger" : "text-haze-3"
              }`}
            >
              {item.type === "submitted" ? "✓" : item.type === "failed" ? "✗" : "●"}
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

/* ─── Code Editor (simple textarea) ─── */
const STARTER_CODE = `function reverseString(s) {
  // Your solution here

}`;

function CodeEditor({ onRun, onSubmit }: { onRun: () => void; onSubmit: () => void }) {
  const [code, setCode] = useState(STARTER_CODE);

  return (
    <div className="flex flex-col h-full">
      {/* Tab */}
      <div className="flex items-center border-b border-cosmos-4 bg-cosmos-3">
        <span className="font-space-mono text-xs text-haze px-4 py-2 border-b-2 border-void">
          solution.js
        </span>
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
      />
      {/* Action bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-cosmos-3 border-t border-cosmos-4">
        <p className="font-space-mono text-[10px] text-haze-3">
          Ctrl+Enter to run · Ctrl+Shift+Enter to submit
        </p>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onRun} className="gap-1.5">
            <Play size={12} aria-hidden="true" /> RUN TESTS
          </Button>
          <Button variant="primary" size="sm" onClick={onSubmit} className="gap-1.5">
            <Upload size={12} aria-hidden="true" /> SUBMIT
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Test Results ─── */
const TESTS = [
  { id: 1, input: '"hello"',   expected: '"olleh"',   status: "pass" as const },
  { id: 2, input: '"abc"',     expected: '"cba"',     status: "pass" as const },
  { id: 3, input: '""',        expected: '""',        status: "fail" as const },
  { id: 4, input: '"a"',       expected: '"a"',       status: "pending" as const },
  { id: 5, input: '"racecar"', expected: '"racecar"', status: "pending" as const },
];

function TestResults({ ran }: { ran: boolean }) {
  return (
    <div className="bg-cosmos-2 border border-cosmos-4 p-4">
      <p className="font-space-mono text-[10px] text-void tracking-widest mb-4 uppercase">
        Test Results
      </p>
      {TESTS.map((t) => (
        <div key={t.id} className={`flex items-center gap-3 py-2 border-b border-cosmos-4/50 last:border-0 ${t.id % 2 === 0 ? "bg-cosmos/30" : ""}`}>
          <span
            className={`font-space-mono text-xs w-4 text-center ${
              t.status === "pass" ? "text-success" : t.status === "fail" ? "text-danger" : "text-haze-3"
            }`}
            aria-label={t.status}
          >
            {t.status === "pass" ? "✓" : t.status === "fail" ? "✗" : "○"}
          </span>
          <div className="flex-1 font-space-mono text-[10px] text-haze-2 min-w-0 truncate">
            {t.input} → {t.expected}
          </div>
        </div>
      ))}
      {ran && (
        <p className="font-space-mono text-[10px] text-haze-3 mt-3">
          Submit to run against 20 hidden tests
        </p>
      )}
    </div>
  );
}

/* ─── Page ─── */
export default function ArenaPage() {
  const [timeLeft, setTimeLeft] = useState(300);
  const [ran, setRan] = useState(false);
  const { toast } = useToast();

  /* Anti-cheat */
  const handleStrike = useCallback(
    (count: number, reason: string) => {
      toast({
        type: "warning",
        title: `TAB SWITCH DETECTED (${count}/3)`,
        message: count >= 3 ? "Final warning: further violations will be flagged." : undefined,
      });
    },
    [toast]
  );
  useArenaGuard({ onStrike: handleStrike });

  /* Timer countdown */
  useEffect(() => {
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 0) { clearInterval(id); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-cosmos">
      {/* ── Top bar ── */}
      <div className="fixed top-0 inset-x-0 z-30 flex items-center justify-between px-6 h-14 bg-cosmos-2 border-b border-cosmos-4">
        <div className="flex items-center gap-3">
          <span className="font-rajdhani font-bold text-sm text-haze">
            String Reversal Clash
          </span>
          <Chip color="ignite" size="xs">CODING</Chip>
        </div>
        <Timer seconds={timeLeft} />
        <div className="flex items-center gap-2">
          <Users size={14} className="text-haze-3" aria-hidden="true" />
          <span className="font-space-mono text-xs text-haze-3">4/4</span>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex flex-1 pt-14">
        {/* Challenge panel */}
        <div className="w-full lg:w-[30%] lg:max-w-xs border-r border-cosmos-4 bg-cosmos-2 p-5 overflow-y-auto">
          <p className="font-space-mono text-[10px] text-void tracking-widest mb-3 uppercase">
            Challenge Brief
          </p>
          <p className="font-rajdhani text-base text-haze leading-relaxed mb-4">
            Write a function{" "}
            <code className="text-void bg-cosmos px-1 font-space-mono text-sm">reverseString(s)</code>{" "}
            that takes a string{" "}
            <code className="text-void bg-cosmos px-1 font-space-mono text-sm">s</code>{" "}
            and returns it reversed. Handle empty strings and single-character strings correctly.
          </p>
          <div className="flex flex-wrap gap-2">
            <Chip color="ignite" size="xs">CODING</Chip>
            <Chip color="crown" size="xs">CHALLENGER</Chip>
            <Chip color="haze" size="xs">BRONZE</Chip>
          </div>
        </div>

        {/* Editor + results */}
        <div className="flex-1 flex flex-col lg:flex-row min-w-0">
          {/* Code editor */}
          <div className="flex-1 flex flex-col border-r border-cosmos-4">
            <CodeEditor onRun={() => setRan(true)} onSubmit={() => {}} />
          </div>

          {/* Right panel */}
          <div className="w-full lg:w-64 xl:w-80 flex flex-col gap-0">
            <div className="flex-1 p-4 overflow-y-auto">
              <TestResults ran={ran} />
            </div>
            <div className="border-t border-cosmos-4">
              <ActivityFeed />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
