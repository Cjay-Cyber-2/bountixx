"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, Phone } from "lucide-react";
import {
  signInWithPopup,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendSignInLinkToEmail,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider, githubProvider } from "@/lib/firebase";
import { useAuth } from "@/components/providers/AuthProvider";
import { BountixxLogo } from "@/components/BountixxLogo";
import { Button } from "@/components/ui/Button";
import { AuthBrandPanel } from "@/components/landing/AuthBrandPanel";
import { staggerContainer, slideUp } from "@/lib/animations";

type Method = "email-password" | "email-link" | "phone-otp";

const quotes = [
  { rank: "Elite", handle: "@dev_kemi", text: "I won 450 coins at 2am. Worth it." },
  { rank: "Champion", handle: "@tunde_logic", text: "Nothing hits like the win sound." },
  { rank: "Legendary", handle: "@chisom_x", text: "5 arenas, 5 wins. Let's go." },
];

export default function SignupPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [quoteIdx] = useState(0);
  const q = quotes[quoteIdx];

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

  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [user, loading, router]);

  function resetMethod(m: Method) {
    setMethod(m);
    setError("");
    setOtp("");
    setLinkSent(false);
    setOtpSent(false);
    setVerifyEmail(false);
  }

  async function handleOAuth(provider: "google" | "github") {
    setPending(true);
    setError("");
    try {
      await signInWithPopup(auth, provider === "google" ? googleProvider : githubProvider);
      router.replace("/dashboard");
    } catch (err: unknown) {
      setError((err as { message: string }).message);
    } finally {
      setPending(false);
    }
  }

  async function handleEmailPassword(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName: username });
      await sendEmailVerification(credential.user);
      setVerifyEmail(true);
    } catch (err: unknown) {
      setError((err as { message: string }).message);
    } finally {
      setPending(false);
    }
  }

  async function handleSendEmailLink(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    try {
      await sendSignInLinkToEmail(auth, email, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: true,
      });
      localStorage.setItem("emailForSignIn", email);
      setLinkSent(true);
    } catch (err: unknown) {
      setError((err as { message: string }).message);
    } finally {
      setPending(false);
    }
  }

  async function handleSendPhoneOtp(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    try {
      if (!recaptchaRef.current && recaptchaContainerRef.current) {
        recaptchaRef.current = new RecaptchaVerifier(auth, recaptchaContainerRef.current, { size: "invisible" });
      }
      confirmationRef.current = await signInWithPhoneNumber(auth, phone, recaptchaRef.current!);
      setOtpSent(true);
    } catch (err: unknown) {
      setError((err as { message: string }).message);
      recaptchaRef.current = null;
    } finally {
      setPending(false);
    }
  }

  async function handleVerifyPhoneOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!confirmationRef.current) return;
    setPending(true);
    setError("");
    try {
      const credential = await confirmationRef.current.confirm(otp);
      if (username) await updateProfile(credential.user, { displayName: username });
      router.replace("/dashboard");
    } catch (err: unknown) {
      setError((err as { message: string }).message);
    } finally {
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
      <div className="hidden lg:flex flex-col items-center justify-center bg-cosmos-2 border-r border-cosmos-4 px-12 py-16 relative overflow-hidden scanline-fx">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(168,85,247,0.08), transparent)" }} aria-hidden="true" />
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="relative z-10 flex flex-col items-center text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 60, ease: "linear", repeat: Infinity }} className="mb-8">
            <BountixxLogo size={160} />
          </motion.div>
          <p className="font-zen-dots text-xl text-void mb-10">Compete. Conquer. Collect.</p>
          <motion.div key={quoteIdx} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="bg-cosmos border border-cosmos-4 p-6 max-w-xs text-left clip-arena-sm">
            <p className="font-space-mono text-[10px] text-void tracking-widest mb-3">✦ {q.rank.toUpperCase()} · {q.handle}</p>
            <p className="font-rajdhani text-lg text-haze-2 italic leading-relaxed">&ldquo;{q.text}&rdquo;</p>
          </motion.div>
        </motion.div>
      </div>

      <div className="flex items-center justify-center px-6 py-16 bg-cosmos">
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="w-full max-w-[440px]">
          <motion.div variants={slideUp} className="lg:hidden flex justify-center mb-8">
            <BountixxLogo size={48} showWordmark />
          </motion.div>


          {/* Pre-heading */}
          <motion.p
            variants={slideUp}
            className="font-space-mono text-[10px] text-void tracking-[6px] mb-3 uppercase"
          >
            INITIATE · PLAYER
          </motion.p>

          <motion.div variants={slideUp}>
            <h1 className="font-zen-dots text-2xl text-haze mb-2">CREATE ACCOUNT</h1>
            <p className="font-rajdhani text-sm text-haze-2 mb-8">Start with 10 free arena creations</p>
          </motion.div>

          <motion.div variants={slideUp} className="flex flex-col gap-3 mb-6">
            <button type="button" onClick={() => handleOAuth("google")} disabled={pending}
              className="cursor-target flex items-center justify-center gap-3 h-12 border border-cosmos-4 text-haze-2 font-rajdhani font-semibold text-sm tracking-wide hover:border-haze-3 hover:text-haze transition-colors disabled:opacity-50">
              <GoogleIcon /> CONTINUE WITH GOOGLE
            </button>
            <button type="button" onClick={() => handleOAuth("github")} disabled={pending}
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
              <Button variant="primary" size="lg" fullWidth magnetic className="mt-2" disabled={pending}>{pending ? "CREATING…" : "ENTER THE ARENA"}</Button>
            </motion.form>
          )}
          {method === "email-password" && verifyEmail && (
            <motion.div key="ep-verify" variants={slideUp} initial="hidden" animate="show" className="text-center py-4">
              <p className="font-zen-dots text-void text-lg mb-3">VERIFY YOUR EMAIL</p>
              <p className="font-rajdhani text-haze-2 text-sm mb-6">We sent a verification link to <span className="text-void">{email}</span>. Click it to activate your account.</p>
              <Link href="/login" className="font-space-mono text-[11px] text-void hover:underline">Back to sign in</Link>
            </motion.div>
          )}

          {/* Email Magic Link */}
          {method === "email-link" && !linkSent && (
            <motion.form key="el" variants={slideUp} initial="hidden" animate="show" onSubmit={handleSendEmailLink} className="flex flex-col gap-5">
              <div>
                <label className="block font-space-mono text-[11px] text-void tracking-[3px] mb-2 uppercase">Email Address</label>
                <input type="email" placeholder="you@arena.com" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 px-4 bg-cosmos-2 border border-cosmos-4 text-haze font-rajdhani text-base placeholder:text-haze-3 focus:outline-none focus:border-void focus:shadow-[0_0_0_2px_rgba(168,85,247,0.2)] transition-all" style={{ borderRadius: 0 }} />
              </div>
              {error && <p className="font-rajdhani text-sm text-red-400">{error}</p>}
              <Button variant="primary" size="lg" fullWidth magnetic className="mt-2" disabled={pending}>{pending ? "SENDING…" : "SEND MAGIC LINK"}</Button>
            </motion.form>
          )}
          {method === "email-link" && linkSent && (
            <motion.div key="el-sent" variants={slideUp} initial="hidden" animate="show" className="text-center py-4">
              <p className="font-zen-dots text-void text-lg mb-3">CHECK YOUR INBOX</p>
              <p className="font-rajdhani text-haze-2 text-sm mb-6">We sent a sign-in link to <span className="text-void">{email}</span>. Click it to enter the arena.</p>
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
                    <button type="button" onClick={() => { setOtpSent(false); setOtp(""); recaptchaRef.current = null; }} className="text-void hover:underline">Resend</button>
                  </p>
                </div>
              )}
              {error && <p className="font-rajdhani text-sm text-red-400">{error}</p>}
              <div ref={recaptchaContainerRef} />
              <Button variant="primary" size="lg" fullWidth magnetic className="mt-2" disabled={pending}>{pending ? "SENDING…" : otpSent ? "VERIFY & JOIN" : "SEND CODE"}</Button>
            </motion.form>
          )}

          <motion.p variants={slideUp} className="font-rajdhani text-sm text-haze-3 text-center mt-8">
            Already have an account?{" "}<Link href="/login" className="cursor-target text-void hover:underline">Sign in</Link>
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
