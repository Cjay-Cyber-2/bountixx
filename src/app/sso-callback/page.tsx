"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { BountixxLogo } from "@/components/BountixxLogo";

/**
 * Clerk redirects OAuth (Google / GitHub) and email-link sign-ins back here.
 * AuthenticateWithRedirectCallback finishes the flow and then sends the user
 * to the dashboard (or back to the sign-in page on failure).
 */
export default function SSOCallbackPage() {
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
        signInForceRedirectUrl="/dashboard"
        signUpForceRedirectUrl="/dashboard"
        signInFallbackRedirectUrl="/dashboard"
        signUpFallbackRedirectUrl="/dashboard"
      />
    </div>
  );
}
