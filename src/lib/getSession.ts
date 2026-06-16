import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "./db";
import { users } from "./schema";
import { eq } from "drizzle-orm";

export type SessionUser = typeof users.$inferSelect;

function sanitizeUsername(raw: string): string {
  return raw.replace(/[^a-z0-9_]/gi, "").toLowerCase() || "player";
}

/**
 * Resolves the authenticated user via Clerk and maps them to the Neon `users`
 * row. On the very first authenticated request after sign-up, the row is
 * created from the Clerk profile with the 500-coin welcome bonus.
 *
 * Returning the same `SessionUser` shape as before means every API route that
 * calls getSession() keeps working unchanged after the Firebase -> Clerk swap.
 */
export async function getSession(): Promise<SessionUser | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (existing) return existing;

  // First time we've seen this Clerk user — create their Neon row.
  let email: string | null = null;
  let avatarUrl: string | null = null;
  let rawUsername = userId.slice(0, 16);

  try {
    const cu = await currentUser();
    if (cu) {
      email =
        cu.primaryEmailAddress?.emailAddress ??
        cu.emailAddresses?.[0]?.emailAddress ??
        null;
      avatarUrl = cu.imageUrl ?? null;
      const metaUsername =
        typeof cu.unsafeMetadata?.username === "string"
          ? (cu.unsafeMetadata.username as string)
          : null;
      rawUsername =
        metaUsername ||
        cu.username ||
        [cu.firstName, cu.lastName].filter(Boolean).join("") ||
        email?.split("@")[0] ||
        userId.slice(0, 16);
    }
  } catch (err) {
    console.error("[getSession] currentUser() failed:", err);
  }

  // Append a short uid suffix to avoid username collisions on first insert.
  const username = `${sanitizeUsername(rawUsername)}_${userId.slice(-5).toLowerCase()}`;

  try {
    await db.insert(users).values({
      id: userId,
      email,
      username,
      avatarUrl,
      coinsBalance: 500,
      xp: 0,
      rank: "recruit",
      roomsCreatedCount: 0,
    });
  } catch (err) {
    // A concurrent request may have already inserted the row — fall through and re-read.
    console.error("[getSession] user insert failed (may already exist):", err);
  }

  const [created] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return created ?? null;
}

export function unauthorized() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
