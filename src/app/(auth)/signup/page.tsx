"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, Phone, ArrowLeft } from "lucide-react";
import { useSignUp, useSignIn } from "@clerk/nextjs/legacy";
import { useAuth } from "@/components/providers/AuthProvider";
import { clerkOAuthUrls, readNextParam } from "@/lib/clerkOAuth";
import { BountixxLogo } from "@/components/BountixxLogo";
import { Button } from "@/components/ui/Button";
import { AuthBrandPanel } from "@/components/landing/AuthBrandPanel";
import { staggerContainer, slideUp } from "@/lib/animations";

type Method = "email-password" | "email-link" | "phone-otp";

function getNext(): string {
  if (typeof window === "undefined") return "/dashboard";
  const n = new URLSearchParams(window.location.search).get("next")
    ?? new URLSearchParams(window.location.search).get("redirect_url");
  return n && n.startsWith("/") ? n : "/dashboard";
}

function clerkError(err: unknown): string {
  const e = err as { errors?: { longMessage?: string; message?: string }[]; message?: string };
  return e?.errors?.[0]?.longMessage ?? e?.errors?.[0]?.message ?? e?.message ?? "Something went wrong. Please try again.";
}

export default function SignupPage() {
  const { loading } = useAuth();
  const { isLoaded, signUp, setActive } = useSignUp();
  const { isLoaded: signInLoaded, signIn } = useSignIn();

  const [method, setMethod] = useState<Method>("email-password");
  const [show, setShow] = useState(false);
  const [pending, setPending] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState(false);
  const [error, setError] = useState("");

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [emailCode, setEmailCode] = useState("");

  // Clerk sometimes lands on /signup#/continue — send to our continue page.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash === "#/continue") {
      const qs = window.location.search;
      window.location.replace(`/signup/continue${qs}`);
    }
  }, []);

  function resetMethod(m: Method) {
    setMethod(m);
    setError("");
    setOtp("");
    setEmailCode("");
    setLinkSent(false);
    setOtpSent(false);
    setVerifyEmail(false);
  }

  async function handleOAuth(provider: "google" | "github") {
    if (!signInLoaded || !signIn) return;
    setError("");
    setPending(true);
    const urls = clerkOAuthUrls();
    try {
      await signIn.authenticateWithRedirect({
        strategy: provider === "google" ? "oauth_google" : "oauth_github",
        redirectUrl: urls.ssoCallback,
        redirectUrlComplete: urls.destination(readNextParam()),
      });
    } catch (err) {
      setError(clerkError(err));
      setPending(false);
    }
  }

  async function handleEmailPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded || !signUp) return;
    setPending(true);
    setError("");
    try {
      await signUp.create({
        emailAddress: email,
        password,
        unsafeMetadata: username ? { username } : undefined,
      });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setVerifyEmail(true);
    } catch (err) {
      setError(clerkError(err));
    } finally {
      setPending(false);
    }
  }

  async function handleVerifyEmailCode(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded || !signUp) return;
    setPending(true);
    setError("");
    try {
      const res = await signUp.attemptEmailAddressVerification({ code: emailCode });
      if (res.status === "complete") {
        await setActive({ session: res.createdSessionId });
        window.location.href = getNext();
      } else {
        setError("Invalid code. Please check your inbox and try again.");
        setPending(false);
      }
    } catch (err) {
      setError(clerkError(err));
      setPending(false);
    }
  }

  async function handleSendEmailLink(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded || !signUp) return;
    setPending(true);
    setError("");
    try {
      await signUp.create({
        emailAddress: email,
        unsafeMetadata: username ? { username } : undefined,
      });
      setLinkSent(true);
      setPending(false);
      const { startEmailLinkFlow } = signUp.createEmailLinkFlow();
      const res = await startEmailLinkFlow({
        redirectUrl: `${window.location.origin}/sso-callback`,
      });
      if (res.status === "complete") {
        await setActive({ session: res.createdSessionId });
        window.location.href = getNext();
      }
    } catch (err) {
      setError(clerkError(err));
      setLinkSent(false);
      setPending(false);
    }
  }

  async function handleSendPhoneOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded || !signUp) return;
    setPending(true);
    setError("");
    try {
      await signUp.create({
        phoneNumber: phone,
        unsafeMetadata: username ? { username } : undefined,
      });
      await signUp.preparePhoneNumberVerification({ strategy: "phone_code" });
      setOtpSent(true);
    } catch (err) {
      setError(clerkError(err));
    } finally {
      setPending(false);
    }
  }

  async function handleVerifyPhoneOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded || !signUp) return;
    setPending(true);
    setError("");
    try {
      const res = await signUp.attemptPhoneNumberVerification({ code: otp });
      if (res.status === "complete") {
        await setActive({ session: res.createdSessionId });
        window.location.href = getNext();
      } else {
        setError("Invalid code. Please try again.");
        setPending(false);
      }
    } catch (err) {
      setError(clerkError(err));
      setPending(false);
    }
  }

  const methodTabs: { id: Method; label: string; icon: React.ReactNode }[] = [
    { id: "email-password", label: "Password", icon: <Lock size={13} /> },
    { id: "email-link", label: "Magic Link", icon: <Mail size={13} /> },
    { id: "phone-otp", label: "Phone", icon: <Phone size={13} /> },
  ];

  if (loading) return null;

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-cosmos">
      {/* Left panel — brand illustration */}
      <AuthBrandPanel />

      {/* Right panel — signup form */}
      <div className="flex items-center justify-center px-6 py-16 bg-cosmos relative">
        {/* Back button */}
        <Link
          href="/"
          className="absolute top-6 left-6 flex items-center gap-1.5 font-space-mono text-[11px] text-haze-2 hover:text-void tracking-widest transition-colors group bg-cosmos-3/60 px-3 py-1.5 rounded-sm"
        >
          <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
          BACK
        </Link>

        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="w-full max-w-[440px]">
          <motion.div variants={slideUp} className="lg:hidden flex justify-center mb-8">
            <BountixxLogo size={48} showWordmark />
          </motion.div>

          <motion.p
            variants={slideUp}
            className="font-space-mono text-[10px] text-void tracking-[6px] mb-3 uppercase"
          >
            INITIATE · PLAYER
          </motion.p>

          <motion.div variants={slideUp}>
            <h1 className="font-zen-dots text-2xl text-haze mb-2">CREATE ACCOUNT</h1>
            <p className="font-rajdhani text-sm text-haze-2 mb-8">Start with 500 free coins welcome bonus</p>
          </motion.div>

          <motion.div variants={slideUp} className="flex flex-col gap-3 mb-6">
            <button type="button" onClick={() => handleOAuth("google")} disabled={pending || !signInLoaded}
              className="cursor-target flex items-center justify-center gap-3 h-12 border border-cosmos-4 text-haze-2 font-rajdhani font-semibold text-sm tracking-wide hover:border-haze-3 hover:text-haze transition-colors disabled:opacity-50">
              <GoogleIcon /> CONTINUE WITH GOOGLE
            </button>
            <button type="button" onClick={() => handleOAuth("github")} disabled={pending || !signInLoaded}
              className="cursor-target flex items-center justify-center gap-3 h-12 border border-cosmos-4 text-haze-2 font-rajdhani font-semibold text-sm tracking-wide hover:border-haze-3 hover:text-haze transition-colors disabled:opacity-50">
              <GitHubIcon /> CONTINUE WITH GITHUB
            </button>
          </motion.div>

          <motion.div variants={slideUp} className="flex items-center gap-3 mb-6">
            <span className="flex-1 h-px bg-cosmos-4" />
            <span className="font-space-mono text-[10px] text-haze-3">OR</span>
            <span className="flex-1 h-px bg-cosmos-4" />
          </motion.div>

          {!verifyEmail && (
            <motion.div variants={slideUp} className="flex mb-6 border border-cosmos-4">
              {methodTabs.map((tab) => (
                <button key={tab.id} type="button" onClick={() => resetMethod(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 h-10 font-space-mono text-[10px] tracking-widest transition-colors ${method === tab.id ? "bg-void text-cosmos" : "text-haze-3 hover:text-haze-2"}`}>
                  {tab.icon}{tab.label.toUpperCase()}
                </button>
              ))}
            </motion.div>
          )}

          {/* Email + Password */}
          {method === "email-password" && !verifyEmail && (
            <motion.form key="ep" variants={slideUp} initial="hidden" animate="show" onSubmit={handleEmailPassword} className="flex flex-col gap-5">
              <div>
                <label className="block font-space-mono text-[11px] text-void tracking-[3px] mb-2 uppercase">Username</label>
                <input type="text" placeholder="arena_name" value={username} onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-12 px-4 bg-cosmos-2 border border-cosmos-4 text-haze font-rajdhani text-base placeholder:text-haze-3 focus:outline-none focus:border-void focus:shadow-[0_0_0_2px_rgba(168,85,247,0.2)] transition-all" style={{ borderRadius: 0 }} />
              </div>
              <div>
                <label className="block font-space-mono text-[11px] text-void tracking-[3px] mb-2 uppercase">Email Address</label>
                <input type="email" placeholder="you@arena.com" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 px-4 bg-cosmos-2 border border-cosmos-4 text-haze font-rajdhani text-base placeholder:text-haze-3 focus:outline-none focus:border-void focus:shadow-[0_0_0_2px_rgba(168,85,247,0.2)] transition-all" style={{ borderRadius: 0 }} />
              </div>
              <div>
                <label className="block font-space-mono text-[11px] text-void tracking-[3px] mb-2 uppercase">Password</label>
                <div className="relative">
                  <input type={show ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-12 px-4 pr-12 bg-cosmos-2 border border-cosmos-4 text-haze font-rajdhani text-base placeholder:text-haze-3 focus:outline-none focus:border-void focus:shadow-[0_0_0_2px_rgba(168,85,247,0.2)] transition-all" style={{ borderRadius: 0 }} />
                  <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-haze-3 hover:text-haze-2 transition-colors">
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              {error && <p className="font-rajdhani text-sm text-red-400">{error}</p>}
              {/* Clerk bot-protection widget mounts here when enabled */}
              <div id="clerk-captcha" />
              <Button variant="primary" size="lg" fullWidth magnetic className="mt-2" disabled={pending}>{pending ? "CREATING…" : "ENTER THE ARENA"}</Button>
            </motion.form>
          )}
          {method === "email-password" && verifyEmail && (
            <motion.form key="ep-verify" variants={slideUp} initial="hidden" animate="show" onSubmit={handleVerifyEmailCode} className="flex flex-col gap-5 text-center">
              <p className="font-zen-dots text-void text-lg">VERIFY YOUR EMAIL</p>
              <p className="font-rajdhani text-haze-2 text-sm">We sent a 6-digit code to <span className="text-void">{email}</span>. Enter it below to activate your account.</p>
              <input type="text" inputMode="numeric" placeholder="000000" value={emailCode} onChange={(e) => setEmailCode(e.target.value)} maxLength={6}
                className="w-full h-12 px-4 bg-cosmos-2 border border-cosmos-4 text-haze font-rajdhani text-base text-center tracking-[8px] placeholder:text-haze-3 focus:outline-none focus:border-void focus:shadow-[0_0_0_2px_rgba(168,85,247,0.2)] transition-all" style={{ borderRadius: 0 }} />
              {error && <p className="font-rajdhani text-sm text-red-400">{error}</p>}
              <Button variant="primary" size="lg" fullWidth magnetic disabled={pending}>{pending ? "VERIFYING…" : "VERIFY & ENTER"}</Button>
              <button type="button" onClick={() => { setVerifyEmail(false); setEmailCode(""); setError(""); }} className="font-space-mono text-[11px] text-haze-3 hover:text-void hover:underline">Use a different email</button>
            </motion.form>
          )}

          {/* Email Magic Link */}
          {method === "email-link" && !linkSent && (
            <motion.form key="el" variants={slideUp} initial="hidden" animate="show" onSubmit={handleSendEmailLink} className="flex flex-col gap-5">
              <div>
                <label className="block font-space-mono text-[11px] text-void tracking-[3px] mb-2 uppercase">Username</label>
                <input type="text" placeholder="arena_name" value={username} onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-12 px-4 bg-cosmos-2 border border-cosmos-4 text-haze font-rajdhani text-base placeholder:text-haze-3 focus:outline-none focus:border-void focus:shadow-[0_0_0_2px_rgba(168,85,247,0.2)] transition-all" style={{ borderRadius: 0 }} />
              </div>
              <div>
                <label className="block font-space-mono text-[11px] text-void tracking-[3px] mb-2 uppercase">Email Address</label>
                <input type="email" placeholder="you@arena.com" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 px-4 bg-cosmos-2 border border-cosmos-4 text-haze font-rajdhani text-base placeholder:text-haze-3 focus:outline-none focus:border-void focus:shadow-[0_0_0_2px_rgba(168,85,247,0.2)] transition-all" style={{ borderRadius: 0 }} />
              </div>
              {error && <p className="font-rajdhani text-sm text-red-400">{error}</p>}
              <div id="clerk-captcha" />
              <Button variant="primary" size="lg" fullWidth magnetic className="mt-2" disabled={pending}>{pending ? "SENDING…" : "SEND MAGIC LINK"}</Button>
            </motion.form>
          )}
          {method === "email-link" && linkSent && (
            <motion.div key="el-sent" variants={slideUp} initial="hidden" animate="show" className="text-center py-4">
              <p className="font-zen-dots text-void text-lg mb-3">CHECK YOUR INBOX</p>
              <p className="font-rajdhani text-haze-2 text-sm mb-6">We sent a sign-in link to <span className="text-void">{email}</span>. Click it to enter the arena. Keep this tab open.</p>
              <button type="button" onClick={() => setLinkSent(false)} className="font-space-mono text-[11px] text-haze-3 hover:text-void hover:underline">Use a different email</button>
            </motion.div>
          )}

          {/* Phone OTP */}
          {method === "phone-otp" && (
            <motion.form key="ph" variants={slideUp} initial="hidden" animate="show" onSubmit={otpSent ? handleVerifyPhoneOtp : handleSendPhoneOtp} className="flex flex-col gap-5">
              <div>
                <label className="block font-space-mono text-[11px] text-void tracking-[3px] mb-2 uppercase">Username</label>
                <input type="text" placeholder="arena_name" value={username} onChange={(e) => setUsername(e.target.value)} disabled={otpSent}
                  className="w-full h-12 px-4 bg-cosmos-2 border border-cosmos-4 text-haze font-rajdhani text-base placeholder:text-haze-3 focus:outline-none focus:border-void focus:shadow-[0_0_0_2px_rgba(168,85,247,0.2)] transition-all disabled:opacity-50" style={{ borderRadius: 0 }} />
              </div>
              <div>
                <label className="block font-space-mono text-[11px] text-void tracking-[3px] mb-2 uppercase">Phone Number</label>
                <input type="tel" placeholder="+2348012345678" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={otpSent}
                  className="w-full h-12 px-4 bg-cosmos-2 border border-cosmos-4 text-haze font-rajdhani text-base placeholder:text-haze-3 focus:outline-none focus:border-void focus:shadow-[0_0_0_2px_rgba(168,85,247,0.2)] transition-all disabled:opacity-50" style={{ borderRadius: 0 }} />
              </div>
              {otpSent && (
                <div>
                  <label className="block font-space-mono text-[11px] text-void tracking-[3px] mb-2 uppercase">Verification Code</label>
                  <input type="text" inputMode="numeric" placeholder="000000" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6}
                    className="w-full h-12 px-4 bg-cosmos-2 border border-cosmos-4 text-haze font-rajdhani text-base tracking-[6px] placeholder:text-haze-3 focus:outline-none focus:border-void focus:shadow-[0_0_0_2px_rgba(168,85,247,0.2)] transition-all" style={{ borderRadius: 0 }} />
                  <p className="font-space-mono text-[10px] text-haze-3 mt-2">
                    Code sent to {phone}.{" "}
                    <button type="button" onClick={() => { setOtpSent(false); setOtp(""); }} className="text-void hover:underline">Resend</button>
                  </p>
                </div>
              )}
              {error && <p className="font-rajdhani text-sm text-red-400">{error}</p>}
              <div id="clerk-captcha" />
              <Button variant="primary" size="lg" fullWidth magnetic className="mt-2" disabled={pending}>{pending ? "SENDING…" : otpSent ? "VERIFY & JOIN" : "SEND CODE"}</Button>
            </motion.form>
          )}

          <motion.p variants={slideUp} className="font-rajdhani text-sm text-haze-2 text-center mt-8">
            Already have an account?{" "}<Link href={`/login?next=${encodeURIComponent(getNext())}`} className="cursor-target text-void hover:underline">Sign in</Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853" />
      <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}
