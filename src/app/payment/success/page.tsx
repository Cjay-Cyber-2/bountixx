"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { CheckCircle, Wallet } from "lucide-react";
import { BountixxLogo } from "@/components/BountixxLogo";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Button } from "@/components/ui/Button";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

type Status = "loading" | "success" | "error";

function PaymentSuccessInner() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");
  const sessionId = searchParams.get("session_id");

  const [status, setStatus] = useState<Status>("loading");
  const [coinsAdded, setCoinsAdded] = useState(0);
  const [newBalance, setNewBalance] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!reference && !sessionId) {
      setStatus("error");
      setErrorMessage("No payment reference found.");
      return;
    }

    // Only Paystack uses the reference param — Stripe credits are handled server-side via webhook
    if (reference) {
      fetchWithAuth("/api/payment/paystack/verify", {
        method: "POST",
        body: JSON.stringify({ reference }),
      })
        .then((r) => r.json())
        .then((data: { ok?: boolean; coinsAdded?: number; newBalance?: number; error?: string }) => {
          if (data.ok) {
            setCoinsAdded(data.coinsAdded ?? 0);
            setNewBalance(data.newBalance ?? 0);
            setStatus("success");
          } else {
            setErrorMessage(data.error ?? "Payment verification failed.");
            setStatus("error");
          }
        })
        .catch(() => {
          setErrorMessage("Network error. Please contact support.");
          setStatus("error");
        });
    } else {
      // Stripe — show generic success; webhook handles crediting
      setCoinsAdded(0);
      setNewBalance(0);
      setStatus("success");
    }
  }, [reference, sessionId]);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(111,45,255,0.12) 0%, transparent 60%), #0E0818" }}
    >
      <div className="flex flex-col items-center gap-8 max-w-md w-full text-center">
        {/* Logo */}
        <BountixxLogo size={52} showWordmark />

        {status === "loading" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="w-16 h-16 border-4 border-void/30 border-t-void rounded-full animate-spin" />
            <p className="font-rajdhani font-semibold text-lg text-haze-2">Verifying payment…</p>
          </motion.div>
        )}

        {status === "success" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="flex flex-col items-center gap-6 w-full"
          >
            {/* Success icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 400, damping: 20 }}
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: "rgba(0,214,143,0.12)", border: "2px solid rgba(0,214,143,0.4)" }}
            >
              <CheckCircle size={40} className="text-success" />
            </motion.div>

            <div>
              <p className="font-space-mono text-[11px] text-crown tracking-[4px] uppercase mb-2">
                Purchase Complete
              </p>
              <h1 className="font-zen-dots text-3xl text-haze">COINS ADDED!</h1>
            </div>

            {coinsAdded > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="w-full p-6 clip-arena"
                style={{ background: "rgba(240,165,0,0.05)", border: "1px solid rgba(240,165,0,0.3)" }}
              >
                <p className="font-space-mono text-[10px] text-haze-3 tracking-[2px] mb-1 uppercase">
                  Coins received
                </p>
                <AnimatedNumber
                  value={coinsAdded}
                  className="font-orbitron font-black text-5xl text-crown block leading-none"
                />
              </motion.div>
            )}

            {newBalance > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="w-full p-4 border border-cosmos-4 bg-cosmos-2"
              >
                <p className="font-space-mono text-[10px] text-haze-3 tracking-[2px] mb-1 uppercase">
                  New balance
                </p>
                <AnimatedNumber
                  value={newBalance}
                  className="font-orbitron font-bold text-2xl text-haze block leading-none"
                />
              </motion.div>
            )}

            {coinsAdded === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="w-full p-4 border border-cosmos-4 bg-cosmos-2"
              >
                <p className="font-rajdhani text-sm text-haze-2">
                  Your coins will be credited within a few seconds.
                </p>
              </motion.div>
            )}

            <Link href="/wallet" className="w-full">
              <Button variant="primary" fullWidth size="lg" magnetic>
                <Wallet size={16} aria-hidden />
                BACK TO WALLET
              </Button>
            </Link>
          </motion.div>
        )}

        {status === "error" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-5 w-full"
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,45,85,0.12)", border: "2px solid rgba(255,45,85,0.4)" }}
            >
              <span className="font-orbitron font-black text-4xl text-danger">!</span>
            </div>
            <div>
              <h1 className="font-zen-dots text-2xl text-haze mb-2">Payment Error</h1>
              <p className="font-rajdhani text-sm text-haze-2">{errorMessage}</p>
            </div>
            <Link href="/wallet" className="w-full">
              <Button variant="secondary" fullWidth size="lg">
                <Wallet size={16} aria-hidden />
                BACK TO WALLET
              </Button>
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cosmos flex items-center justify-center">
        <div className="spinner" />
      </div>
    }>
      <PaymentSuccessInner />
    </Suspense>
  );
}
