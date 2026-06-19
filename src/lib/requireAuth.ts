import { createClerkClient } from "@clerk/backend";
import { getAuth } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";

export type AuthResult =
  | { ok: true; userId: string }
  | { ok: false; response: Response };

function clerkClient() {
  const secretKey = process.env.CLERK_SECRET_KEY?.trim();
  if (!secretKey) return null;
  return createClerkClient({ secretKey });
}

/**
 * Authenticate an API route using the incoming Request.
 * Tries Clerk middleware headers first, then falls back to direct cookie auth.
 */
export async function requireClerkAuth(req: Request): Promise<AuthResult> {
  try {
    const { userId } = getAuth(req as unknown as NextRequest);
    if (userId) return { ok: true, userId };
  } catch (err) {
    console.error("[requireClerkAuth] getAuth(req) failed:", err);
  }

  const client = clerkClient();
  if (!client) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({
          error:
            "Clerk server auth failed — set CLERK_SECRET_KEY in Vercel (Production + Preview) and redeploy",
        }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      ),
    };
  }

  try {
    const state = await client.authenticateRequest(req, {
      secretKey: process.env.CLERK_SECRET_KEY!,
      publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      signInUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "/login",
      signUpUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || "/signup",
    });
    const userId = state.toAuth()?.userId;
    if (userId) {
      return { ok: true, userId };
    }
  } catch (err) {
    console.error("[requireClerkAuth] authenticateRequest failed:", err);
  }

  return {
    ok: false,
    response: new Response(
      JSON.stringify({ error: "Please sign in to continue.", code: "AUTH_REQUIRED" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    ),
  };
}

/**
 * Health probe for Clerk server configuration.
 */
export async function clerkAuthHealth(
  req: Request
): Promise<{ ok: true } | { ok: false; error: string }> {
  const secretKey = process.env.CLERK_SECRET_KEY?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();

  if (!secretKey) {
    return { ok: false, error: "CLERK_SECRET_KEY is not set" };
  }
  if (!publishableKey) {
    return { ok: false, error: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not set" };
  }

  const client = clerkClient();
  if (!client) {
    return { ok: false, error: "Could not create Clerk client" };
  }

  try {
    await client.authenticateRequest(req, {
      secretKey,
      publishableKey,
      signInUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "/login",
      signUpUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || "/signup",
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[clerkAuthHealth] authenticateRequest failed:", message);
    return { ok: false, error: message };
  }
}
