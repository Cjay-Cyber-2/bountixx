import { auth, currentUser, getAuth } from "@clerk/nextjs/server";
import { createClerkClient } from "@clerk/backend";
import type { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { db } from "./db";
import { coinTransactions, users } from "./schema";
import { eq } from "drizzle-orm";
import {
  isUnlimitedCoinsEmail,
  STARTER_COINS,
  UNLIMITED_COINS_BALANCE,
} from "./coins";
import { ensureDatabaseSchema } from "./ensureSchema";

export type SessionUser = typeof users.$inferSelect;

function sanitizeUsername(raw: string): string {
  return raw.replace(/[^a-z0-9_]/gi, "").toLowerCase() || "player";
}

function isUniqueViolation(err: unknown, column?: string): boolean {
  const message = err instanceof Error ? err.message : String(err);
  const lower = message.toLowerCase();
  if (!lower.includes("unique") && !lower.includes("duplicate")) return false;
  if (!column) return true;
  return lower.includes(column);
}

async function readClerkProfile() {
  let email: string | null = null;
  let avatarUrl: string | null = null;
  let rawUsername = "";

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
        "";
    }
  } catch (err) {
    console.error("[getSession] currentUser() failed:", err);
  }

  return { email, avatarUrl, rawUsername };
}

async function normalizeUserCoins(
  user: SessionUser,
  clerkEmail: string | null,
): Promise<SessionUser> {
  const email = clerkEmail ?? user.email;
  const updates: Partial<typeof users.$inferInsert> = {};

  if (email && email !== user.email) {
    updates.email = email;
  }

  if (isUnlimitedCoinsEmail(email)) {
    if (user.coinsBalance < UNLIMITED_COINS_BALANCE) {
      updates.coinsBalance = UNLIMITED_COINS_BALANCE;
    }
  } else if (user.coinsBalance === 0) {
    updates.coinsBalance = STARTER_COINS;
    try {
      await db.insert(coinTransactions).values({
        id: randomUUID(),
        userId: user.id,
        amount: STARTER_COINS,
        type: "gifted",
        reference: "welcome_bonus",
      });
    } catch (err) {
      console.error("[getSession] welcome bonus tx failed:", err);
    }
  }

  if (Object.keys(updates).length === 0) {
    return user;
  }

  const [updated] = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, user.id))
    .returning();

  return updated ?? { ...user, ...updates };
}

/**
 * Clerk user id for API routes that only need "is this request signed in?"
 * Never throws — returns null when Clerk server auth is unavailable.
 */
export async function getClerkUserId(req?: Request): Promise<string | null> {
  if (req) {
    try {
      const { userId } = getAuth(req as unknown as NextRequest);
      if (userId) return userId;
    } catch (err) {
      console.error("[auth] getAuth(req) failed:", err);
    }

    const secretKey = process.env.CLERK_SECRET_KEY?.trim();
    if (secretKey) {
      try {
        const client = createClerkClient({ secretKey });
        const state = await client.authenticateRequest(req, {
          secretKey,
          publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
          signInUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "/login",
          signUpUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || "/signup",
        });
        const userId = state.toAuth()?.userId;
        if (userId) return userId;
      } catch (err) {
        console.error("[auth] authenticateRequest failed:", err);
      }
    }
  }

  try {
    const { userId } = await auth();
    return userId ?? null;
  } catch (err) {
    console.error("[auth] auth() failed:", err);
    return null;
  }
}

/**
 * Resolves the authenticated user via Clerk and maps them to the Neon `users`
 * row. On the very first authenticated request after sign-up, the row is
 * created from the Clerk profile with the 500-coin welcome bonus.
 *
 * Never throws — returns null when auth or the database is unavailable.
 */
export async function getSession(req?: Request): Promise<SessionUser | null> {
  const userId = await getClerkUserId(req);
  if (!userId) return null;

  try {
    await ensureDatabaseSchema();
    const { email, avatarUrl, rawUsername } = await readClerkProfile();

    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (existing) {
      return normalizeUserCoins(existing, email);
    }

    const username = `${sanitizeUsername(rawUsername || userId.slice(0, 16))}_${userId.slice(-5).toLowerCase()}`;
    const startingCoins = isUnlimitedCoinsEmail(email)
      ? UNLIMITED_COINS_BALANCE
      : STARTER_COINS;

    const baseRow = {
      id: userId,
      username,
      avatarUrl,
      coinsBalance: startingCoins,
      xp: 0,
      rank: "recruit" as const,
      roomsCreatedCount: 0,
      lastSeenAt: new Date(),
    };

    try {
      await db.insert(users).values({
        ...baseRow,
        email,
      });
    } catch (err) {
      // Firebase → Clerk migration: email may already belong to an old row.
      if (email && isUniqueViolation(err, "email")) {
        try {
          await db.insert(users).values({
            ...baseRow,
            email: null,
          });
        } catch (retryErr) {
          console.error("[getSession] user insert retry failed:", retryErr);
        }
      } else {
        console.error("[getSession] user insert failed (may already exist):", err);
      }
    }

    const [created] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!created) return null;

    if (!isUnlimitedCoinsEmail(email) && startingCoins > 0) {
      await db.insert(coinTransactions).values({
        id: randomUUID(),
        userId: created.id,
        amount: startingCoins,
        type: "gifted",
        reference: "welcome_bonus",
      });
    }

    return created;
  } catch (err) {
    console.error("[getSession] database error:", err);
    return null;
  }
}

export function unauthorized() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

export function sessionUnavailable(message?: string) {
  return new Response(
    JSON.stringify({
      error:
        message ??
        "Account setup failed — sign out and sign back in. If this continues, check DATABASE_URL in Vercel.",
    }),
    { status: 503, headers: { "Content-Type": "application/json" } },
  );
}

export function clerkMisconfigured() {
  return new Response(
    JSON.stringify({
      error:
        "Clerk server auth failed — set CLERK_SECRET_KEY in Vercel (Production + Preview) and redeploy",
    }),
    { status: 503, headers: { "Content-Type": "application/json" } }
  );
}
