"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { BountixxLogo } from "@/components/BountixxLogo";

function safeNext(): string {
  if (typeof window === "undefined") return "/dashboard";
  const params = new URLSearchParams(window.location.search);
  const next = params.get("redirect_url") ?? params.get("next");
  if (next && next.startsWith("/")) return next;
  return "/dashboard";
}

/**
 * Clerk redirects OAuth (Google / GitHub) and email-link sign-ins back here.
 * AuthenticateWithRedirectCallback finishes the flow and sends the user to
 * /dashboard (or the ?next= path) using our custom UI — not accounts.dev.
 */
export default function SSOCallbackPage() {
  const destination = safeNext();

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
        signInForceRedirectUrl={destination}
        signUpForceRedirectUrl={destination}
        signInFallbackRedirectUrl={destination}
        signUpFallbackRedirectUrl={destination}
      />
    </div>
  );
}
