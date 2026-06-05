"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { BountixxLogo } from "@/components/BountixxLogo";
import { Button } from "@/components/ui/Button";
import { staggerContainer, slideUp } from "@/lib/animations";

const quotes = [
  { rank: "Elite", handle: "@dev_kemi", text: "I won 450 coins at 2am. Worth it." },
  { rank: "Champion", handle: "@tunde_logic", text: "Nothing hits like the win sound." },
  { rank: "Legendary", handle: "@chisom_x", text: "5 arenas, 5 wins. Let's go." },
];

export default function SignupPage() {
  const [show, setShow] = useState(false);
  const [quoteIdx] = useState(0);
  const q = quotes[quoteIdx];

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-cosmos">
      {/* ── Left: Brand panel ── */}
      <div className="hidden lg:flex flex-col items-center justify-center bg-cosmos-2 border-r border-cosmos-4 px-12 py-16 relative overflow-hidden scanline-fx">
        {/* Background glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(155,107,255,0.08), transparent)" }}
          aria-hidden="true"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 flex flex-col items-center text-center"
        >
          {/* Rotating logo */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 60, ease: "linear", repeat: Infinity }}
            className="mb-8"
          >
            <BountixxLogo size={160} />
          </motion.div>

          {/* Tagline */}
          <p className="font-rajdhani font-bold text-2xl text-ignite mb-10 tracking-wide">
            Compete. Conquer. Collect.
          </p>

          {/* Quote card */}
          <motion.div
            key={quoteIdx}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-cosmos border border-cosmos-4 p-6 max-w-xs text-left clip-arena-sm"
          >
            <p className="font-share-mono text-[10px] text-ignite tracking-widest mb-3">
              ✦ {q.rank.toUpperCase()} · {q.handle}
            </p>
            <p className="font-rajdhani text-lg text-haze-2 italic leading-relaxed">
              &ldquo;{q.text}&rdquo;
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* ── Right: Form panel ── */}
      <div className="flex items-center justify-center px-6 py-16 bg-cosmos">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="w-full max-w-[440px]"
        >
          {/* Mobile logo */}
          <motion.div variants={slideUp} className="lg:hidden flex justify-center mb-8">
            <BountixxLogo size={48} showWordmark />
          </motion.div>

          <motion.div variants={slideUp}>
            <h1 className="font-orbitron font-bold text-3xl text-haze mb-2">
              CREATE ACCOUNT
            </h1>
            <p className="font-rajdhani text-sm text-haze-2 mb-10">
              Start with 10 free arena creations
            </p>
          </motion.div>

          <motion.form variants={slideUp} className="flex flex-col gap-5" noValidate>
            <Field label="USERNAME" type="text" placeholder="arena_name" />
            <Field label="EMAIL ADDRESS" type="email" placeholder="you@arena.com" />
            <PasswordField label="PASSWORD" show={show} onToggle={() => setShow(!show)} />

            <Button variant="primary" size="lg" fullWidth magnetic className="mt-2">
              ENTER THE ARENA
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <span className="flex-1 h-px bg-cosmos-4" />
              <span className="font-share-mono text-[10px] text-haze-3">OR</span>
              <span className="flex-1 h-px bg-cosmos-4" />
            </div>

            {/* Google OAuth */}
            <button
              type="button"
              className="flex items-center justify-center gap-3 h-12 border border-cosmos-4 text-haze-2
                         font-rajdhani font-semibold text-sm tracking-wide hover:border-haze-3 hover:text-haze transition-colors"
            >
              <GoogleIcon />
              CONTINUE WITH GOOGLE
            </button>
          </motion.form>

          <motion.p
            variants={slideUp}
            className="font-rajdhani text-sm text-haze-3 text-center mt-8"
          >
            Already have an account?{" "}
            <Link href="/login" className="text-void hover:underline">
              Sign in
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}

function Field({ label, type, placeholder }: { label: string; type: string; placeholder: string }) {
  return (
    <div>
      <label className="block font-share-mono text-[11px] text-ignite tracking-[3px] mb-2 uppercase">
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full h-12 px-4 bg-cosmos-2 border border-cosmos-4 text-haze font-rajdhani text-base
                   placeholder:text-haze-3 focus:outline-none focus:border-ignite
                   focus:shadow-[0_0_0_2px_rgba(255,107,26,0.2)] transition-all"
        style={{ borderRadius: 0 }}
      />
    </div>
  );
}

function PasswordField({
  label,
  show,
  onToggle,
}: {
  label: string;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <label className="block font-share-mono text-[11px] text-ignite tracking-[3px] mb-2 uppercase">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          placeholder="••••••••"
          className="w-full h-12 px-4 pr-12 bg-cosmos-2 border border-cosmos-4 text-haze font-rajdhani text-base
                     placeholder:text-haze-3 focus:outline-none focus:border-ignite
                     focus:shadow-[0_0_0_2px_rgba(255,107,26,0.2)] transition-all"
          style={{ borderRadius: 0 }}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-haze-3 hover:text-haze-2 transition-colors"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
