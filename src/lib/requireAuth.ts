import { auth } from "@clerk/nextjs/server";
import { getClerkUserId, unauthorized, clerkMisconfigured } from "@/lib/getSession";

export type AuthResult =
  | { ok: true; userId: string }
  | { ok: false; response: Response };

/**
 * Lightweight auth for API routes that only need a signed-in Clerk user.
 * Does not touch the database.
 */
export async function requireClerkAuth(): Promise<AuthResult> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { ok: false, response: unauthorized() };
    }
    return { ok: true, userId };
  } catch (err) {
    console.error("[requireClerkAuth] auth() failed:", err);
    return { ok: false, response: clerkMisconfigured() };
  }
}

/**
 * Confirms Clerk auth() is configured. Returns null when auth works (even if
 * the caller is signed out). Returns a Response when Clerk server keys fail.
 */
export async function clerkAuthHealth(): Promise<Response | null> {
  try {
    await auth();
    return null;
  } catch (err) {
    console.error("[clerkAuthHealth] auth() failed:", err);
    return clerkMisconfigured();
  }
}

export { getClerkUserId };
