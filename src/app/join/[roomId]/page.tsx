"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { BountixxLogo } from "@/components/BountixxLogo";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/providers/AuthProvider";
import { scalePop } from "@/lib/animations";

type JoinState =
  | { phase: "loading" }
  | { phase: "joining" }
  | { phase: "error"; message: string; showResults?: boolean }
  | { phase: "success" };

export default function JoinPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<JoinState>({ phase: "loading" });

  useEffect(() => {
    // Wait for auth to resolve
    if (authLoading) return;

    // Not authenticated → redirect to login
    if (!user) {
      router.replace(`/login?next=/join/${roomId}`);
      return;
    }

    // Authenticated → attempt to join
    async function tryJoin() {
      setState({ phase: "joining" });
      try {
        const res = await fetch(`/api/rooms/${roomId}/join`, {
          method: "POST",
        });

        // Success: player added
        if (res.status === 201) {
          setState({ phase: "success" });
          setTimeout(() => router.replace(`/lobby/${roomId}`), 800);
          return;
        }

        // Parse response body for all other cases
        const json = (await res.json()) as { message?: string; error?: string };

        // Already in room
        if (res.ok && json.message === "Already in this room") {
          setState({ phase: "success" });
          setTimeout(() => router.replace(`/lobby/${roomId}`), 800);
          return;
        }

        // Room no longer accepting players (live/ended)
        if (res.status === 409 && json.error === "Room is no longer accepting players") {
          setState({
            phase: "error",
            message: "This arena is already in progress or has ended.",
            showResults: true,
          });
          return;
        }

        // Room full
        if (res.status === 409 && json.error === "Room is full") {
          setState({ phase: "error", message: "This arena is full. Try another room." });
          return;
        }

        // Generic error
        setState({
          phase: "error",
          message: json.error ?? json.message ?? "Could not join this room.",
        });
      } catch {
        setState({ phase: "error", message: "Network error. Please try again." });
      }
    }

    tryJoin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, roomId]);

  return (
    <div className="min-h-screen bg-cosmos flex items-center justify-center px-6">
      {/* Scan lines */}
      <div className="absolute inset-0 scanline-fx pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 flex flex-col items-center gap-8 text-center max-w-sm w-full">
        {/* Logo */}
        <motion.div
          variants={scalePop}
          initial="hidden"
          animate="show"
          className="bob"
        >
          <BountixxLogo size={64} showWordmark />
        </motion.div>

        {state.phase === "loading" && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="spinner scale-125" />
            <p className="font-space-mono text-xs text-haze-3 tracking-widest">
              LOADING...
            </p>
          </motion.div>
        )}

        {state.phase === "joining" && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="spinner scale-125" />
            <p className="font-space-mono text-xs text-void tracking-widest">
              ENTERING ARENA...
            </p>
            <p className="font-rajdhani text-sm text-haze-2">
              Connecting you to the room
            </p>
          </motion.div>
        )}

        {state.phase === "success" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 14, stiffness: 280 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="w-16 h-16 rounded-full bg-success/10 border border-success/30 flex items-center justify-center">
              <span className="text-success text-2xl font-bold">✓</span>
            </div>
            <p className="font-zen-dots text-xl text-haze">JOINED!</p>
            <p className="font-space-mono text-xs text-haze-3 tracking-widest">
              REDIRECTING TO LOBBY...
            </p>
          </motion.div>
        )}

        {state.phase === "error" && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-5 w-full"
          >
            <div className="w-16 h-16 rounded-full bg-danger/10 border border-danger/30 flex items-center justify-center">
              <span className="text-danger text-2xl font-bold">✗</span>
            </div>

            <div className="bg-cosmos-2 border border-cosmos-4 p-5 clip-arena-sm w-full">
              <p className="font-zen-dots text-lg text-danger mb-2">UNABLE TO JOIN</p>
              <p className="font-rajdhani text-sm text-haze-2 leading-relaxed">
                {state.message}
              </p>
            </div>

            <div className="flex flex-col gap-2 w-full">
              {state.showResults && (
                <Link href={`/arena/${roomId}/results`}>
                  <Button variant="primary" size="md" fullWidth>
                    VIEW RESULTS
                  </Button>
                </Link>
              )}
              <Link href="/dashboard">
                <Button variant="secondary" size="md" fullWidth>
                  BACK TO DASHBOARD
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
