import { randomUUID } from "crypto";
import { db } from "./db";
import { achievements, submissions, rooms, users } from "./schema";
import { eq, and, count, sql } from "drizzle-orm";

const BADGE_IDS = [
  "first_blood",
  "unstoppable",
  "code_beast",
  "puzzle_king",
  "bounty_hunter",
  "arena_host",
  "legendary_solver",
  "speed_demon",
] as const;

export type BadgeId = (typeof BADGE_IDS)[number];

async function hasBadge(userId: string, badgeId: BadgeId): Promise<boolean> {
  const [row] = await db
    .select({ id: achievements.id })
    .from(achievements)
    .where(and(eq(achievements.userId, userId), eq(achievements.badgeId, badgeId)))
    .limit(1);
  return Boolean(row);
}

async function awardBadge(userId: string, badgeId: BadgeId): Promise<boolean> {
  if (await hasBadge(userId, badgeId)) return false;
  await db.insert(achievements).values({
    id: randomUUID(),
    userId,
    badgeId,
  });
  return true;
}

/** Evaluate and unlock any newly earned badges after a room outcome. */
export async function checkAndAwardAchievements(
  userId: string,
  opts: {
    won?: boolean;
    roomCategory?: string | null;
    solveSeconds?: number | null;
    coinsBalance?: number;
    rank?: string;
    roomsCreatedCount?: number;
    consecutiveWins?: number;
  },
): Promise<BadgeId[]> {
  const unlocked: BadgeId[] = [];

  if (opts.won && (await awardBadge(userId, "first_blood"))) {
    unlocked.push("first_blood");
  }

  if ((opts.consecutiveWins ?? 0) >= 5 && (await awardBadge(userId, "unstoppable"))) {
    unlocked.push("unstoppable");
  }

  if (opts.won && opts.roomCategory === "coding") {
    const [{ c }] = await db
      .select({ c: count() })
      .from(submissions)
      .innerJoin(rooms, eq(submissions.roomId, rooms.id))
      .where(
        and(
          eq(submissions.userId, userId),
          eq(submissions.isWinner, true),
          eq(rooms.category, "coding"),
        ),
      );
    if (c >= 10 && (await awardBadge(userId, "code_beast"))) {
      unlocked.push("code_beast");
    }
  }

  if (opts.won && opts.roomCategory === "logic") {
    const [{ c }] = await db
      .select({ c: count() })
      .from(submissions)
      .innerJoin(rooms, eq(submissions.roomId, rooms.id))
      .where(
        and(
          eq(submissions.userId, userId),
          eq(submissions.isWinner, true),
          eq(rooms.category, "logic"),
        ),
      );
    if (c >= 10 && (await awardBadge(userId, "puzzle_king"))) {
      unlocked.push("puzzle_king");
    }
  }

  const [userRow] = await db
    .select({
      coins: users.coinsBalance,
      rank: users.rank,
      roomsCreated: users.roomsCreatedCount,
      consecutiveWins: users.consecutiveWins,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const coins = opts.coinsBalance ?? userRow?.coins ?? 0;
  if (coins >= 1000 && (await awardBadge(userId, "bounty_hunter"))) {
    unlocked.push("bounty_hunter");
  }

  const created = opts.roomsCreatedCount ?? userRow?.roomsCreated ?? 0;
  if (created >= 20 && (await awardBadge(userId, "arena_host"))) {
    unlocked.push("arena_host");
  }

  const rank = opts.rank ?? userRow?.rank ?? "recruit";
  if (rank === "legendary" && (await awardBadge(userId, "legendary_solver"))) {
    unlocked.push("legendary_solver");
  }

  if (
    opts.won &&
    opts.solveSeconds != null &&
    opts.solveSeconds < 60 &&
    (await awardBadge(userId, "speed_demon"))
  ) {
    unlocked.push("speed_demon");
  }

  return unlocked;
}

/** Bump consecutive win streak on win; reset on loss / no win. */
export async function updateConsecutiveWins(userId: string, won: boolean): Promise<number> {
  const [user] = await db
    .select({ consecutiveWins: users.consecutiveWins })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const next = won ? (user?.consecutiveWins ?? 0) + 1 : 0;
  await db.update(users).set({ consecutiveWins: next }).where(eq(users.id, userId));
  return next;
}
