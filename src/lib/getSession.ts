import { cookies } from "next/headers";
import { adminAuth } from "./firebase-admin";
import { db } from "./db";
import { users } from "./schema";
import { eq } from "drizzle-orm";

export type SessionUser = typeof users.$inferSelect;

/**
 * Verifies the __session cookie and returns the matching DB user.
 * Returns null if unauthenticated or user not found.
 */
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("__session")?.value;
  if (!sessionCookie) return null;

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.uid))
      .limit(1);
    return user ?? null;
  } catch {
    return null;
  }
}

/** Quick auth check — throws 401 text if not authenticated */
export function unauthorized() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
