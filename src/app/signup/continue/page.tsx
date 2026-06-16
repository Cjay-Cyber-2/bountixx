"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useSignUp } from "@clerk/nextjs/legacy";
import { BountixxLogo } from "@/components/BountixxLogo";
import { Button } from "@/components/ui/Button";
import { AuthBrandPanel } from "@/components/landing/AuthBrandPanel";
import { readNextParam } from "@/lib/clerkOAuth";
import { staggerContainer, slideUp } from "@/lib/animations";

function fieldLabel(field: string): string {
  const labels: Record<string, string> = {
    username: "Username",
    first_name: "First name",
    last_name: "Last name",
    legal_accepted: "Terms of service",
    phone_number: "Phone number",
  };
  return labels[field] ?? field.replace(/_/g, " ");
}

function clerkError(err: unknown): string {
  const e = err as { errors?: { longMessage?: string; message?: string }[]; message?: string };
  return e?.errors?.[0]?.longMessage ?? e?.errors?.[0]?.message ?? e?.message ?? "Something went wrong. Please try again.";
}

/**
 * Clerk sends new Google/GitHub users here when sign-up needs extra fields
 * (legal terms, username, etc.). Without this page OAuth loops back to /signup#/continue.
 */
export default function SignupContinuePage() {
  const router = useRouter();
  const { isLoaded, signUp, setActive } = useSignUp();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoaded) return;
    if (!signUp?.id) {
      router.replace("/signup");
      return;
    }
    if (signUp.status === "complete" && signUp.createdSessionId) {
      void setActive({ session: signUp.createdSessionId }).then(() => {
        window.location.href = readNextParam();
      });
    }
  }, [isLoaded, signUp, setActive, router]);

  if (!isLoaded || !signUp?.id) {
    return (
      <div className="min-h-screen bg-cosmos flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  const missingFields = signUp.missingFields ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!signUp) return;
    setPending(true);
    setError("");

    try {
      const payload: Record<string, unknown> = { ...formData };
      if (missingFields.includes("legal_accepted")) {
        payload.legal_accepted = legalAccepted;
      }

      const res = await signUp.update(payload);
      if (res.status === "complete") {
        await setActive({ session: res.createdSessionId });
        window.location.href = readNextParam();
        return;
      }

      setError("Please complete all required fields.");
      setPending(false);
    } catch (err) {
      setError(clerkError(err));
      setPending(false);
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-cosmos">
      <AuthBrandPanel />

      <div className="flex items-center justify-center px-6 py-16 relative">
        <Link
          href="/signup"
          className="absolute top-6 left-6 flex items-center gap-1.5 font-space-mono text-[11px] text-haze-2 hover:text-void tracking-widest transition-colors group bg-cosmos-3/60 px-3 py-1.5 rounded-sm"
        >
          <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
          BACK
        </Link>

        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="w-full max-w-[440px]">
          <motion.div variants={slideUp} className="lg:hidden flex justify-center mb-8">
            <BountixxLogo size={48} showWordmark />
          </motion.div>

          <motion.p variants={slideUp} className="font-space-mono text-[10px] text-void tracking-[6px] mb-3 uppercase">
            ALMOST THERE
          </motion.p>

          <motion.div variants={slideUp}>
            <h1 className="font-zen-dots text-2xl text-haze mb-2">FINISH SIGN UP</h1>
            <p className="font-rajdhani text-sm text-haze-2 mb-8">
              Google verified you — one more step to enter the arena.
            </p>
          </motion.div>

          <motion.form variants={slideUp} onSubmit={handleSubmit} className="flex flex-col gap-5">
            {missingFields
              .filter((f) => f !== "legal_accepted")
              .map((field) => (
                <div key={field}>
                  <label className="block font-space-mono text-[11px] text-void tracking-[3px] mb-2 uppercase">
                    {fieldLabel(field)}
                  </label>
                  <input
                    type={field === "phone_number" ? "tel" : "text"}
                    value={formData[field] ?? ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, [field]: e.target.value }))}
                    className="w-full h-12 px-4 bg-cosmos-2 border border-cosmos-4 text-haze font-rajdhani text-base placeholder:text-haze-3 focus:outline-none focus:border-void focus:shadow-[0_0_0_2px_rgba(168,85,247,0.2)] transition-all"
                    style={{ borderRadius: 0 }}
                    required
                  />
                </div>
              ))}

            {missingFields.includes("legal_accepted") && (
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={legalAccepted}
                  onChange={(e) => setLegalAccepted(e.target.checked)}
                  className="mt-1"
                />
                <span className="font-rajdhani text-sm text-haze-2">
                  I agree to the Bountixx terms of service and privacy policy.
                </span>
              </label>
            )}

            {error && <p className="font-rajdhani text-sm text-red-400">{error}</p>}
            <div id="clerk-captcha" />
            <Button variant="primary" size="lg" fullWidth magnetic disabled={pending}>
              {pending ? "ENTERING ARENA…" : "ENTER THE ARENA"}
            </Button>
          </motion.form>
        </motion.div>
      </div>
    </div>
  );
}
