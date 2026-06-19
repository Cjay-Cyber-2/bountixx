"use client";

import { Suspense, useState, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, Phone } from "lucide-react";
import { useSignIn } from "@clerk/nextjs/legacy";
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
import { useSearchParams } from "next/navigation";
import { slideUp } from "@/lib/animations";

type Method = "email-password" | "email-link" | "phone-otp";

function getNext(searchParams: URLSearchParams | null): string {
  const n = searchParams?.get("next") ?? searchParams?.get("redirect_url");
  return n && n.startsWith("/") ? n : "/dashboard";
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cosmos" />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const { loading, user } = useAuth();
  const { isLoaded, signIn, setActive } = useSignIn();
  const searchParams = useSearchParams();
  const nextPath = getNext(searchParams);

  useRedirectIfSignedIn(nextPath);

  const [method, setMethod] = useState<Method>("email-password");
  const [show, setShow] = useState(false);
  const [pending, setPending] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const phoneIdRef = useRef<string | null>(null);

  function resetMethod(m: Method) {
    setMethod(m);
    setError("");
    setOtp("");
    setLinkSent(false);
    setOtpSent(false);
  }

  async function handleOAuth(provider: "google" | "github") {
    if (!isLoaded || !signIn) return;
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
    if (!isLoaded || !signIn) return;
    setPending(true);
    setError("");
    try {
      const res = await signIn.create({ identifier, password });
      if (res.status === "complete") {
        await setActive({ session: res.createdSessionId });
        window.location.href = nextPath;
      } else {
        setError("Additional verification is required. Try a magic link or contact support.");
        setPending(false);
      }
    } catch (err) {
      setError(clerkError(err));
      setPending(false);
    }
  }

  async function handleSendEmailLink(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded || !signIn) return;
    setPending(true);
    setError("");
    try {
      const si = await signIn.create({ identifier: email });
      const factor = si.supportedFirstFactors?.find((f) => f.strategy === "email_link");
      if (!factor || !("emailAddressId" in factor)) {
        setError("Magic link sign-in is not enabled. Please use a password or Google.");
        setPending(false);
        return;
      }
      setLinkSent(true);
      setPending(false);
      const { startEmailLinkFlow } = signIn.createEmailLinkFlow();
      const res = await startEmailLinkFlow({
        emailAddressId: factor.emailAddressId,
        redirectUrl: `${window.location.origin}/sso-callback?next=${encodeURIComponent(nextPath)}`,
      });
      if (res.status === "complete") {
        await setActive({ session: res.createdSessionId });
        window.location.href = nextPath;
      }
    } catch (err) {
      setError(clerkError(err));
      setLinkSent(false);
      setPending(false);
    }
  }

  async function handleSendPhoneOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded || !signIn) return;
    setPending(true);
    setError("");
    try {
      const si = await signIn.create({ identifier: phone });
      const factor = si.supportedFirstFactors?.find((f) => f.strategy === "phone_code");
      if (!factor || !("phoneNumberId" in factor)) {
        setError("Phone sign-in is not enabled for this account.");
        setPending(false);
        return;
      }
      phoneIdRef.current = factor.phoneNumberId;
      await signIn.prepareFirstFactor({ strategy: "phone_code", phoneNumberId: factor.phoneNumberId });
      setOtpSent(true);
    } catch (err) {
      setError(clerkError(err));
    } finally {
      setPending(false);
    }
  }

  async function handleVerifyPhoneOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded || !signIn) return;
    setPending(true);
    setError("");
    try {
      const res = await signIn.attemptFirstFactor({ strategy: "phone_code", code: otp });
      if (res.status === "complete") {
        await setActive({ session: res.createdSessionId });
        window.location.href = nextPath;
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

  if (loading || user) return null;

  const { theme } = useTheme();

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-cosmos">
      <div data-legacy-aesthetic={theme === "light" ? undefined : ""} className="contents">
        <AuthBrandPanel />
      </div>

      <AuthFormShell
        eyebrow="Welcome back"
        title="Sign in"
        subtitle="Pick up where you left off in the arena."
        footer={
          <>
            No account yet?{" "}
            <Link href={`/signup?next=${encodeURIComponent(nextPath)}`} className="cursor-target text-plum hover:underline font-medium">
              Create one free
            </Link>
          </>
        }
      >
        <motion.div variants={slideUp} className="flex flex-col gap-3">
          <OAuthButton onClick={() => handleOAuth("google")} disabled={pending || !isLoaded}>
            <GoogleIcon /> Continue with Google
          </OAuthButton>
          <OAuthButton onClick={() => handleOAuth("github")} disabled={pending || !isLoaded}>
            <GitHubIcon /> Continue with GitHub
          </OAuthButton>
        </motion.div>

        <AuthDivider />

        <motion.div variants={slideUp}>
          <MethodTabs tabs={methodTabs} active={method} onChange={resetMethod} />
        </motion.div>

        {method === "email-password" && (
          <motion.form key="ep" variants={slideUp} initial="hidden" animate="show" onSubmit={handleEmailPassword} className="flex flex-col gap-5">
            <div>
              <label className="bx-label" htmlFor="login-email">Email</label>
              <input id="login-email" type="email" placeholder="you@arena.com" value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="bx-input" />
            </div>
            <div>
              <label className="bx-label" htmlFor="login-password">Password</label>
              <div className="relative">
                <input id="login-password" type={show ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="bx-input pr-12" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-haze-3 hover:text-haze-2 transition-colors">
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {error && <AuthError message={error} />}
            <Button variant="primary" size="lg" fullWidth magnetic disabled={pending}>
              {pending ? "Signing in…" : "Sign in"}
            </Button>
          </motion.form>
        )}

        {method === "email-link" && !linkSent && (
          <motion.form key="el" variants={slideUp} initial="hidden" animate="show" onSubmit={handleSendEmailLink} className="flex flex-col gap-5">
            <div>
              <label className="bx-label" htmlFor="login-magic-email">Email</label>
              <input id="login-magic-email" type="email" placeholder="you@arena.com" value={email} onChange={(e) => setEmail(e.target.value)} className="bx-input" />
            </div>
            {error && <AuthError message={error} />}
            <Button variant="primary" size="lg" fullWidth magnetic disabled={pending}>
              {pending ? "Sending…" : "Send magic link"}
            </Button>
          </motion.form>
        )}

        {method === "email-link" && linkSent && (
          <motion.div key="el-sent" variants={slideUp} initial="hidden" animate="show" className="text-center py-4">
            <p className="font-display text-xl text-haze mb-3">Check your inbox</p>
            <p className="text-haze-2 text-sm mb-6 leading-relaxed">
              We sent a sign-in link to <span className="text-plum font-medium">{email}</span>. Click it to enter the arena.
            </p>
            <button type="button" onClick={() => setLinkSent(false)} className="text-sm text-haze-3 hover:text-plum hover:underline">
              Use a different email
            </button>
          </motion.div>
        )}

        {method === "phone-otp" && (
          <motion.form key="ph" variants={slideUp} initial="hidden" animate="show" onSubmit={otpSent ? handleVerifyPhoneOtp : handleSendPhoneOtp} className="flex flex-col gap-5">
            <div>
              <label className="bx-label" htmlFor="login-phone">Phone number</label>
              <input id="login-phone" type="tel" placeholder="+2348012345678" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={otpSent} className="bx-input disabled:opacity-50" />
            </div>
            {otpSent && (
              <div>
                <label className="bx-label" htmlFor="login-otp">Verification code</label>
                <input id="login-otp" type="text" inputMode="numeric" placeholder="000000" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} className="bx-input tracking-[0.3em]" />
                <p className="text-xs text-haze-3 mt-2">
                  Code sent to {phone}.{" "}
                  <button type="button" onClick={() => { setOtpSent(false); setOtp(""); }} className="text-plum hover:underline">
                    Resend
                  </button>
                </p>
              </div>
            )}
            {error && <AuthError message={error} />}
            <Button variant="primary" size="lg" fullWidth magnetic disabled={pending}>
              {pending ? "Sending…" : otpSent ? "Verify code" : "Send code"}
            </Button>
          </motion.form>
        )}
      </AuthFormShell>
    </div>
  );
}
