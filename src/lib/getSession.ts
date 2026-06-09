import { cookies, headers } from "next/headers";
import { adminAuth } from "./firebase-admin";
import { db } from "./db";
import { users } from "./schema";
import { eq } from "drizzle-orm";

export type SessionUser = typeof users.$inferSelect;

async function getUserById(uid: string): Promise<SessionUser | null> {
  const [user] = await db.select().from(users).where(eq(users.id, uid)).limit(1);
  return user ?? null;
}

/**
 * Resolves the authenticated user from either:
 *   1. Authorization: Bearer <Firebase ID token>  (preferred — always fresh)
 *   2. __session httpOnly cookie (Firebase session cookie)
 */
export async function getSession(): Promise<SessionUser | null> {
  // 1. Authorization header — Firebase ID token (short-lived, auto-refreshed by SDK)
  try {
    const headerStore = await headers();
    const authHeader = headerStore.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const idToken = authHeader.slice(7);
      const decoded = await adminAuth.verifyIdToken(idToken);
      const user = await getUserById(decoded.uid);
      if (user) return user;
    }
  } catch {
    // fall through to cookie
  }

  // 2. Session cookie fallback
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("__session")?.value;
    if (!sessionCookie) return null;
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, false);
    return await getUserById(decoded.uid);
  } catch {
    return null;
  }
}

export function unauthorized() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
