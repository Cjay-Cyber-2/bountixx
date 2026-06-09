import { cookies, headers } from "next/headers";
import { adminAuth } from "./firebase-admin";
import { db } from "./db";
import { users } from "./schema";
import { eq } from "drizzle-orm";

export type SessionUser = typeof users.$inferSelect;

async function findUser(uid: string): Promise<SessionUser | null> {
  const [user] = await db.select().from(users).where(eq(users.id, uid)).limit(1);
  return user ?? null;
}

/**
 * When a Firebase ID token is valid but the user row is missing from the DB
 * (e.g. DB was down during login so the /api/auth/session insert never ran),
 * create them now so they're not permanently locked out.
 */
async function findOrCreateUser(
  uid: string,
  claims: { email?: string; name?: string; picture?: string }
): Promise<SessionUser | null> {
  const existing = await findUser(uid);
  if (existing) return existing;

  try {
    const rawUsername =
      claims.name?.replace(/\s+/g, "_").toLowerCase() ??
      claims.email?.split("@")[0] ??
      uid.slice(0, 16);

    // Append a short uid suffix to avoid username collisions on first insert
    const username = `${rawUsername}_${uid.slice(0, 5)}`;

    await db.insert(users).values({
      id: uid,
      email: claims.email ?? null,
      username,
      avatarUrl: claims.picture ?? null,
      coinsBalance: 500,
      xp: 0,
      rank: "recruit",
      roomsCreatedCount: 0,
    });

    return await findUser(uid);
  } catch (err) {
    console.error("[getSession] auto-create user failed:", uid, err);
    return null;
  }
}

/**
 * Resolves the authenticated user via:
 *   1. Authorization: Bearer <Firebase ID token>  — always fresh, sent by fetchWithAuth()
 *   2. __session httpOnly cookie                  — fallback for older sessions
 * Returns null if neither succeeds.
 */
export async function getSession(): Promise<SessionUser | null> {
  // ── 1. Authorization header (Firebase ID token) ──────────────────────────
  try {
    const headerStore = await headers();
    const authHeader = headerStore.get("Authorization");

    if (authHeader?.startsWith("Bearer ")) {
      const idToken = authHeader.slice(7);
      const decoded = await adminAuth.verifyIdToken(idToken);
      const user = await findOrCreateUser(decoded.uid, decoded);
      if (user) return user;
      console.error("[getSession] ID token valid but user unresolvable:", decoded.uid);
    }
  } catch (err) {
    // Log the real error so it shows in Vercel function logs
    console.error("[getSession] verifyIdToken error:", err);
  }

  // ── 2. Session cookie fallback ────────────────────────────────────────────
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("__session")?.value;

    if (!sessionCookie) {
      console.error("[getSession] no Authorization header and no __session cookie");
      return null;
    }

    const decoded = await adminAuth.verifySessionCookie(sessionCookie, false);
    // Use findOrCreateUser so a user whose DB row is missing (e.g. auth/session insert
    // silently failed) is auto-created with their 500-coin welcome bonus here.
    const user = await findOrCreateUser(decoded.uid, decoded);

    if (!user) {
      console.error("[getSession] session cookie valid but user unresolvable:", decoded.uid);
    }

    return user;
  } catch (err) {
    console.error("[getSession] verifySessionCookie error:", err);
    return null;
  }
}

export function unauthorized() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
