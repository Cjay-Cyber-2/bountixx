"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { BountixxLogo } from "@/components/BountixxLogo";
import { Button } from "@/components/ui/Button";
import { staggerContainer, slideUp } from "@/lib/animations";

export default function LoginPage() {
  const [show, setShow] = useState(false);

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-cosmos">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col items-center justify-center bg-cosmos-2 border-r border-cosmos-4 px-12 py-16 relative overflow-hidden scanline-fx">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(255,107,26,0.06), transparent)" }}
          aria-hidden="true"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 flex flex-col items-center text-center gap-8"
        >
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 60, ease: "linear", repeat: Infinity }}>
            <BountixxLogo size={160} />
          </motion.div>
          <p className="font-orbitron font-bold text-2xl text-ignite tracking-wide">
            Welcome Back, Champion
          </p>
          <p className="font-rajdhani text-lg text-haze-2 max-w-xs">
            The arena never sleeps. Neither do winners.
          </p>
        </motion.div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-6 py-16">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="w-full max-w-[440px]"
        >
          <motion.div variants={slideUp} className="lg:hidden flex justify-center mb-8">
            <BountixxLogo size={48} showWordmark />
          </motion.div>

          <motion.div variants={slideUp}>
            <h1 className="font-orbitron font-bold text-3xl text-haze mb-2">SIGN IN</h1>
            <p className="font-rajdhani text-sm text-haze-2 mb-10">
              Your rivalry awaits
            </p>
          </motion.div>

          <motion.form variants={slideUp} className="flex flex-col gap-5" noValidate>
            <div>
              <label className="block font-share-mono text-[11px] text-ignite tracking-[3px] mb-2 uppercase">
                Email or Username
              </label>
              <input
                type="text"
                placeholder="you@arena.com"
                className="w-full h-12 px-4 bg-cosmos-2 border border-cosmos-4 text-haze font-rajdhani text-base
                           placeholder:text-haze-3 focus:outline-none focus:border-ignite
                           focus:shadow-[0_0_0_2px_rgba(255,107,26,0.2)] transition-all"
                style={{ borderRadius: 0 }}
              />
            </div>
            <div>
              <label className="block font-share-mono text-[11px] text-ignite tracking-[3px] mb-2 uppercase">
                Password
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
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-haze-3 hover:text-haze-2 transition-colors"
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link href="#" className="font-share-mono text-[11px] text-void hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button variant="primary" size="lg" fullWidth magnetic>
              SIGN IN
            </Button>

            <div className="flex items-center gap-3">
              <span className="flex-1 h-px bg-cosmos-4" />
              <span className="font-share-mono text-[10px] text-haze-3">OR</span>
              <span className="flex-1 h-px bg-cosmos-4" />
            </div>

            <button
              type="button"
              className="flex items-center justify-center gap-3 h-12 border border-cosmos-4 text-haze-2
                         font-rajdhani font-semibold text-sm tracking-wide hover:border-haze-3 hover:text-haze transition-colors"
            >
              <GoogleIcon />
              CONTINUE WITH GOOGLE
            </button>
          </motion.form>

          <motion.p variants={slideUp} className="font-rajdhani text-sm text-haze-3 text-center mt-8">
            No account yet?{" "}
            <Link href="/signup" className="text-void hover:underline">
              Create one free
            </Link>
          </motion.p>
        </motion.div>
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
