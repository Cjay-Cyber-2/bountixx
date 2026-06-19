"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, Phone } from "lucide-react";
import { useSignUp, useSignIn } from "@clerk/nextjs/legacy";
import { useAuth } from "@/components/providers/AuthProvider";
import { clerkOAuthUrls, readNextParam } from "@/lib/clerkOAuth";
import { clerkError, isSessionExistsError } from "@/lib/clerkError";
import { useRedirectIfSignedIn } from "@/hooks/useRedirectIfSignedIn";
import { Button } from "@/components/ui/Button";
import { AuthBrandPanel } from "@/components/landing/AuthBrandPanel";
import { useTheme } from "@/components/providers/ThemeProvider";
import {
  AuthFormShell,
  AuthDivider,
  AuthError,
  GitHubIcon,
  GoogleIcon,
  MethodTabs,
  OAuthButton,
} from "@/components/auth/AuthFormShell";
import { slideUp } from "@/lib/animations";

type Method = "email-password" | "email-link" | "phone-otp";

function getNext(): string {
  if (typeof window === "undefined") return "/dashboard";
  const n = new URLSearchParams(window.location.search).get("next")
    ?? new URLSearchParams(window.location.search).get("redirect_url");
  return n && n.startsWith("/") ? n : "/dashboard";
}

export default function SignupPage() {
  const { loading, user } = useAuth();
  const { isLoaded, signUp, setActive } = useSignUp();
  const { isLoaded: signInLoaded, signIn } = useSignIn();
  const nextPath = getNext();

  useRedirectIfSignedIn(nextPath);

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
    if (user) {
      window.location.replace(nextPath);
      return;
    }
    setError("");
    setPending(true);
    const urls = clerkOAuthUrls(nextPath);
    try {
      await signIn.authenticateWithRedirect({
        strategy: provider === "google" ? "oauth_google" : "oauth_github",
        redirectUrl: urls.ssoCallback,
        redirectUrlComplete: urls.destination(nextPath),
      });
    } catch (err) {
      if (isSessionExistsError(err)) {
        window.location.replace(nextPath);
        return;
      }
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
        redirectUrl: `${window.location.origin}/sso-callback?next=${encodeURIComponent(nextPath)}`,
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
    { id: "email-link", label: "Magic link", icon: <Mail size={13} /> },
    { id: "phone-otp", label: "Phone", icon: <Phone size={13} /> },
  ];

  const { theme } = useTheme();
  if (loading || user) return null;

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-cosmos">
      <div data-legacy-aesthetic={theme === "light" ? undefined : ""} className="contents">
        <AuthBrandPanel />
      </div>

      <AuthFormShell
        eyebrow="Join the arena"
        title="Create account"
        subtitle="Start with 500 free coins as a welcome bonus."
        footer={
          <>
            Already have an account?{" "}
            <Link href={`/login?next=${encodeURIComponent(getNext())}`} className="cursor-target text-plum hover:underline font-medium">
              Sign in
            </Link>
          </>
        }
      >
        <motion.div variants={slideUp} className="flex flex-col gap-3">
          <OAuthButton onClick={() => handleOAuth("google")} disabled={pending || !signInLoaded}>
            <GoogleIcon /> Continue with Google
          </OAuthButton>
          <OAuthButton onClick={() => handleOAuth("github")} disabled={pending || !signInLoaded}>
            <GitHubIcon /> Continue with GitHub
          </OAuthButton>
        </motion.div>

        <AuthDivider />

        {!verifyEmail && (
          <motion.div variants={slideUp}>
            <MethodTabs tabs={methodTabs} active={method} onChange={resetMethod} />
          </motion.div>
        )}

        {method === "email-password" && !verifyEmail && (
          <motion.form key="ep" variants={slideUp} initial="hidden" animate="show" onSubmit={handleEmailPassword} className="flex flex-col gap-5">
            <div>
              <label className="bx-label" htmlFor="signup-username">Username</label>
              <input id="signup-username" type="text" placeholder="arena_name" value={username} onChange={(e) => setUsername(e.target.value)} className="bx-input" />
            </div>
            <div>
              <label className="bx-label" htmlFor="signup-email">Email</label>
              <input id="signup-email" type="email" placeholder="you@arena.com" value={email} onChange={(e) => setEmail(e.target.value)} className="bx-input" />
            </div>
            <div>
              <label className="bx-label" htmlFor="signup-password">Password</label>
              <div className="relative">
                <input id="signup-password" type={show ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="bx-input pr-12" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-haze-3 hover:text-haze-2 transition-colors">
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {error && <AuthError message={error} />}
            <div id="clerk-captcha" />
            <Button variant="primary" size="lg" fullWidth magnetic disabled={pending}>
              {pending ? "Creating…" : "Create account"}
            </Button>
          </motion.form>
        )}

        {method === "email-password" && verifyEmail && (
          <motion.form key="ep-verify" variants={slideUp} initial="hidden" animate="show" onSubmit={handleVerifyEmailCode} className="flex flex-col gap-5 text-center">
            <p className="font-display text-xl text-haze">Verify your email</p>
            <p className="text-haze-2 text-sm leading-relaxed">
              We sent a 6-digit code to <span className="text-plum font-medium">{email}</span>.
            </p>
            <input type="text" inputMode="numeric" placeholder="000000" value={emailCode} onChange={(e) => setEmailCode(e.target.value)} maxLength={6} className="bx-input text-center tracking-[0.4em]" />
            {error && <AuthError message={error} />}
            <Button variant="primary" size="lg" fullWidth magnetic disabled={pending}>
              {pending ? "Verifying…" : "Verify and enter"}
            </Button>
            <button type="button" onClick={() => { setVerifyEmail(false); setEmailCode(""); setError(""); }} className="text-sm text-haze-3 hover:text-plum hover:underline">
              Use a different email
            </button>
          </motion.form>
        )}

        {method === "email-link" && !linkSent && (
          <motion.form key="el" variants={slideUp} initial="hidden" animate="show" onSubmit={handleSendEmailLink} className="flex flex-col gap-5">
            <div>
              <label className="bx-label" htmlFor="signup-link-username">Username</label>
              <input id="signup-link-username" type="text" placeholder="arena_name" value={username} onChange={(e) => setUsername(e.target.value)} className="bx-input" />
            </div>
            <div>
              <label className="bx-label" htmlFor="signup-link-email">Email</label>
              <input id="signup-link-email" type="email" placeholder="you@arena.com" value={email} onChange={(e) => setEmail(e.target.value)} className="bx-input" />
            </div>
            {error && <AuthError message={error} />}
            <div id="clerk-captcha" />
            <Button variant="primary" size="lg" fullWidth magnetic disabled={pending}>
              {pending ? "Sending…" : "Send magic link"}
            </Button>
          </motion.form>
        )}

        {method === "email-link" && linkSent && (
          <motion.div key="el-sent" variants={slideUp} initial="hidden" animate="show" className="text-center py-4">
            <p className="font-display text-xl text-haze mb-3">Check your inbox</p>
            <p className="text-haze-2 text-sm mb-6 leading-relaxed">
              We sent a sign-in link to <span className="text-plum font-medium">{email}</span>.
            </p>
            <button type="button" onClick={() => setLinkSent(false)} className="text-sm text-haze-3 hover:text-plum hover:underline">
              Use a different email
            </button>
          </motion.div>
        )}

        {method === "phone-otp" && (
          <motion.form key="ph" variants={slideUp} initial="hidden" animate="show" onSubmit={otpSent ? handleVerifyPhoneOtp : handleSendPhoneOtp} className="flex flex-col gap-5">
            <div>
              <label className="bx-label" htmlFor="signup-phone-username">Username</label>
              <input id="signup-phone-username" type="text" placeholder="arena_name" value={username} onChange={(e) => setUsername(e.target.value)} disabled={otpSent} className="bx-input disabled:opacity-50" />
            </div>
            <div>
              <label className="bx-label" htmlFor="signup-phone">Phone number</label>
              <input id="signup-phone" type="tel" placeholder="+2348012345678" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={otpSent} className="bx-input disabled:opacity-50" />
            </div>
            {otpSent && (
              <div>
                <label className="bx-label" htmlFor="signup-otp">Verification code</label>
                <input id="signup-otp" type="text" inputMode="numeric" placeholder="000000" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} className="bx-input tracking-[0.3em]" />
                <p className="text-xs text-haze-3 mt-2">
                  Code sent to {phone}.{" "}
                  <button type="button" onClick={() => { setOtpSent(false); setOtp(""); }} className="text-plum hover:underline">
                    Resend
                  </button>
                </p>
              </div>
            )}
            {error && <AuthError message={error} />}
            <div id="clerk-captcha" />
            <Button variant="primary" size="lg" fullWidth magnetic disabled={pending}>
              {pending ? "Sending…" : otpSent ? "Verify and join" : "Send code"}
            </Button>
          </motion.form>
        )}
      </AuthFormShell>
    </div>
  );
}
