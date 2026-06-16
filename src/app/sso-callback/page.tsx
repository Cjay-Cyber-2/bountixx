"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { BountixxLogo } from "@/components/BountixxLogo";
import { clerkOAuthUrls, readNextParam } from "@/lib/clerkOAuth";

/**
 * Clerk OAuth callback. When sign-up needs extra fields (terms, username),
 * users go to /signup/continue — NOT /signup#/continue.
 */
export default function SSOCallbackPage() {
  const urls = clerkOAuthUrls();
  const destination = readNextParam();

  return (
    <div className="min-h-[100dvh] bg-cosmos flex flex-col items-center justify-center gap-6">
      <BountixxLogo size={52} showWordmark />
      <div className="flex items-center gap-3">
        <div className="spinner" />
        <p className="font-space-mono text-xs text-haze-3 tracking-[3px] uppercase">
          Completing sign-in…
        </p>
      </div>
      <AuthenticateWithRedirectCallback
        continueSignUpUrl={urls.continueSignUp}
        signInUrl="/login"
        signUpUrl="/signup"
        signInForceRedirectUrl={urls.destination(destination)}
        signUpForceRedirectUrl={urls.destination(destination)}
        signInFallbackRedirectUrl={urls.destination("/dashboard")}
        signUpFallbackRedirectUrl={urls.destination("/dashboard")}
      />
      <div id="clerk-captcha" />
    </div>
  );
}
