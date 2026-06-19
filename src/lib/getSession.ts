import { auth, currentUser, getAuth } from "@clerk/nextjs/server";
import { createClerkClient } from "@clerk/backend";
import type { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { eq, and } from "drizzle-orm";
import { db } from "./db";
import { coinTransactions, users } from "./schema";
import {
  isUnlimitedCoinsEmail,
  MAIN_EVENT_GRANT_REF,
  STARTER_COINS,
  UNLIMITED_COINS_BALANCE,
} from "./coins";
import { ensureDatabaseSchema } from "./ensureSchema";
import { touchPresence } from "./presence";

export type SessionUser = typeof users.$inferSelect;

function sanitizeUsername(raw: string): string {
  return raw.replace(/[^a-z0-9_]/gi, "").toLowerCase() || "player";
}

function buildUsername(rawUsername: string, userId: string): string {
  const base = sanitizeUsername(rawUsername || userId.slice(0, 16));
  return `${base}_${userId.slice(-5).toLowerCase()}`;
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

async function mainEventStarterGrantedTotal(userId: string): Promise<number> {
  const txs = await db
    .select({ amount: coinTransactions.amount })
    .from(coinTransactions)
    .where(
      and(
        eq(coinTransactions.userId, userId),
        eq(coinTransactions.reference, MAIN_EVENT_GRANT_REF),
        eq(coinTransactions.type, "gifted"),
      ),
    );

  return txs.reduce((total, tx) => total + Math.max(0, tx.amount ?? 0), 0);
}

/** One-time main-event grant: 1,000 coins once per account. Spent coins stay spent. */
async function ensureOneTimeStarterCoins(
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
    if (Object.keys(updates).length === 0) return user;
    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, user.id))
      .returning();
    return updated ?? { ...user, ...updates };
  }

  const grantedTotal = await mainEventStarterGrantedTotal(user.id);
  const owed = Math.max(0, STARTER_COINS - grantedTotal);

  if (owed === 0) {
    if (Object.keys(updates).length === 0) return user;
    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, user.id))
      .returning();
    return updated ?? { ...user, ...updates };
  }

  const previous = user.coinsBalance ?? 0;
  const targetBalance = Math.max(previous, STARTER_COINS);
  const credit = Math.max(0, targetBalance - previous);

  if (credit > 0) {
    updates.coinsBalance = targetBalance;
  }

  const [updated] = await db
    .update(users)
    .set(
      Object.keys(updates).length > 0
        ? { ...updates, email: updates.email ?? user.email }
        : { email: updates.email ?? user.email },
    )
    .where(eq(users.id, user.id))
    .returning();

  try {
    await db.insert(coinTransactions).values({
      id: randomUUID(),
      userId: user.id,
      amount: owed,
      type: "gifted",
      reference: MAIN_EVENT_GRANT_REF,
    });
  } catch (err) {
    console.error("[getSession] main event launch grant tx failed:", err);
    if (credit > 0) {
      return (await findUserById(user.id)) ?? updated ?? { ...user, coinsBalance: targetBalance };
    }
    return (await findUserById(user.id)) ?? updated ?? user;
  }

  return (await findUserById(user.id)) ?? updated ?? (credit > 0 ? { ...user, coinsBalance: targetBalance } : user);
}

async function findUserById(userId: string): Promise<SessionUser | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return user ?? null;
}

async function createUserRecord(
  userId: string,
  profile: { email: string | null; avatarUrl: string | null; rawUsername: string },
): Promise<SessionUser | null> {
  const startingCoins = isUnlimitedCoinsEmail(profile.email)
    ? UNLIMITED_COINS_BALANCE
    : STARTER_COINS;

  const attempts = [
    { username: buildUsername(profile.rawUsername, userId), email: profile.email },
    { username: buildUsername(profile.rawUsername, userId), email: null as string | null },
    {
      username: `${buildUsername(profile.rawUsername, userId)}_${randomUUID().slice(0, 4)}`,
      email: profile.email,
    },
    {
      username: `${buildUsername(profile.rawUsername, userId)}_${randomUUID().slice(0, 4)}`,
      email: null as string | null,
    },
  ];

  for (const attempt of attempts) {
    try {
      await db.insert(users).values({
        id: userId,
        username: attempt.username,
        email: attempt.email,
        avatarUrl: profile.avatarUrl,
        coinsBalance: startingCoins,
        xp: 0,
        rank: "recruit",
        roomsCreatedCount: 0,
        lastSeenAt: new Date(),
      });
      const created = await findUserById(userId);
      if (created) return created;
    } catch (err) {
      if (isUniqueViolation(err, "id")) {
        return findUserById(userId);
      }
      if (!isUniqueViolation(err)) {
        console.error("[getSession] user insert failed:", err);
      }
    }
  }

  return findUserById(userId);
}

async function finalizeSession(
  user: SessionUser,
  clerkEmail: string | null,
): Promise<SessionUser> {
  await ensureOneTimeStarterCoins(user, clerkEmail);
  const fresh = await findUserById(user.id);
  const resolved = fresh ?? user;
  await touchPresence(resolved.id, true);
  return resolved;
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
 * created with 1,000 starter coins (one-time main-event grant).
 *
 * Never throws — returns null when auth or the database is unavailable.
 */
export async function getSession(req?: Request): Promise<SessionUser | null> {
  const userId = await getClerkUserId(req);
  if (!userId) return null;

  try {
    await ensureDatabaseSchema();
    const profile = await readClerkProfile();

    let user = await findUserById(userId);
    if (!user) {
      user = await createUserRecord(userId, profile);
    }

    if (!user) return null;

    return finalizeSession(user, profile.email);
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
