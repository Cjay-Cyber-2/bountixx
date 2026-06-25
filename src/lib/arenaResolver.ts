import { randomUUID } from "crypto";
import { db } from "./db";
import { rooms, roomPlayers, submissions, users, coinTransactions } from "./schema";
import { eq, and, sql } from "drizzle-orm";
import { ENTRY_FEE } from "./coins";
import { getRoomQuestions } from "./roomQuestions";
import { sendNotificationToUser } from "./sendNotification";
import { checkAndAwardAchievements, updateConsecutiveWins } from "./achievements";

const XP_WIN = 200;
const XP_PARTICIPATION = 25;

type ScoreRow = {
  userId: string;
  correct: number;
  firstCorrectAt: Date | null;
};

/** Aggregate per-user correct answers across all questions in a room. */
export async function scoreRoom(roomId: string): Promise<ScoreRow[]> {
  const allSubs = await db
    .select({
      userId: submissions.userId,
      testsPassed: submissions.testsPassed,
      testsTotal: submissions.testsTotal,
      submittedAt: submissions.submittedAt,
      questionIndex: submissions.questionIndex,
    })
    .from(submissions)
    .where(eq(submissions.roomId, roomId));

  const byUser = new Map<string, ScoreRow>();

  for (const sub of allSubs) {
    const correct = sub.testsPassed > 0 && sub.testsPassed === sub.testsTotal ? 1 : 0;
    const existing = byUser.get(sub.userId) ?? {
      userId: sub.userId,
      correct: 0,
      firstCorrectAt: null,
    };
    existing.correct += correct;
    if (correct > 0) {
      const at = sub.submittedAt ?? new Date();
      if (!existing.firstCorrectAt || at < existing.firstCorrectAt) {
        existing.firstCorrectAt = at;
      }
    }
    byUser.set(sub.userId, existing);
  }

  return [...byUser.values()].sort((a, b) => {
    if (b.correct !== a.correct) return b.correct - a.correct;
    const aT = a.firstCorrectAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const bT = b.firstCorrectAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
    return aT - bT;
  });
}

/** True when a user has a correct submission for every question index. */
export async function userHasPerfectScore(
  roomId: string,
  userId: string,
  questionCount: number,
): Promise<boolean> {
  if (questionCount <= 0) return false;

  const subs = await db
    .select({
      questionIndex: submissions.questionIndex,
      testsPassed: submissions.testsPassed,
      testsTotal: submissions.testsTotal,
    })
    .from(submissions)
    .where(and(eq(submissions.roomId, roomId), eq(submissions.userId, userId)));

  const correctIndices = new Set<number>();
  for (const sub of subs) {
    if (sub.testsPassed > 0 && sub.testsPassed === sub.testsTotal) {
      correctIndices.add(sub.questionIndex ?? 0);
    }
  }

  if (correctIndices.size < questionCount) return false;
  for (let i = 0; i < questionCount; i++) {
    if (!correctIndices.has(i)) return false;
  }
  return true;
}

/** True when a user has submitted an answer for every question index (right or wrong). */
export async function userAnsweredAllQuestions(
  roomId: string,
  userId: string,
  questionCount: number,
): Promise<boolean> {
  if (questionCount <= 0) return false;

  const subs = await db
    .select({ questionIndex: submissions.questionIndex })
    .from(submissions)
    .where(and(eq(submissions.roomId, roomId), eq(submissions.userId, userId)));

  const answeredIndices = new Set(subs.map((s) => s.questionIndex ?? 0));
  if (answeredIndices.size < questionCount) return false;
  for (let i = 0; i < questionCount; i++) {
    if (!answeredIndices.has(i)) return false;
  }
  return true;
}

/** Multi-question winner: must have answered every question AND every answer correct. */
export async function userQualifiesAsMultiQuestionWinner(
  roomId: string,
  userId: string,
  questionCount: number,
): Promise<boolean> {
  if (questionCount <= 1) return false;
  if (!(await userAnsweredAllQuestions(roomId, userId, questionCount))) return false;
  return userHasPerfectScore(roomId, userId, questionCount);
}

/** First competitor to answer every question correctly — wins by speed. */
export async function findFirstPerfectScorer(
  roomId: string,
  questionCount: number,
): Promise<{ userId: string; completedAt: Date } | null> {
  const allSubs = await db
    .select({
      userId: submissions.userId,
      questionIndex: submissions.questionIndex,
      testsPassed: submissions.testsPassed,
      testsTotal: submissions.testsTotal,
      submittedAt: submissions.submittedAt,
    })
    .from(submissions)
    .where(eq(submissions.roomId, roomId));

  const byUser = new Map<string, { indices: Set<number>; completionAt: Date | null }>();

  for (const sub of allSubs) {
    if (sub.testsPassed <= 0 || sub.testsPassed !== sub.testsTotal) continue;

    const idx = sub.questionIndex ?? 0;
    const existing = byUser.get(sub.userId) ?? { indices: new Set<number>(), completionAt: null };
    existing.indices.add(idx);

    if (existing.indices.size === questionCount) {
      const at = sub.submittedAt ?? new Date();
      if (!existing.completionAt || at > existing.completionAt) {
        existing.completionAt = at;
      }
    }

    byUser.set(sub.userId, existing);
  }

  let best: { userId: string; completedAt: Date } | null = null;
  for (const [userId, row] of byUser) {
    if (row.indices.size < questionCount || !row.completionAt) continue;
    if (!best || row.completionAt < best.completedAt) {
      best = { userId, completedAt: row.completionAt };
    }
  }

  return best;
}

async function hasArenaWinner(roomId: string): Promise<boolean> {
  const [winnerSub] = await db
    .select({ id: submissions.id })
    .from(submissions)
    .where(and(eq(submissions.roomId, roomId), eq(submissions.isWinner, true)))
    .limit(1);
  if (winnerSub) return true;

  const [winnerTx] = await db
    .select({ id: coinTransactions.id })
    .from(coinTransactions)
    .where(eq(coinTransactions.reference, `room:${roomId}:winner`))
    .limit(1);

  return Boolean(winnerTx);
}

/** Crown a single winner, end the room, and pay the prize pool. Idempotent if already ended. */
export async function crownArenaWinner(roomId: string, winnerId: string): Promise<boolean> {
  const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
  if (!room) return false;
  if (room.status !== "live" && room.status !== "ended") return false;

  const [existingWinnerTx] = await db
    .select({ id: coinTransactions.id })
    .from(coinTransactions)
    .where(eq(coinTransactions.reference, `room:${roomId}:winner`))
    .limit(1);

  if (existingWinnerTx) return true;

  const competitors = await db
    .select({ userId: roomPlayers.userId })
    .from(roomPlayers)
    .where(and(eq(roomPlayers.roomId, roomId), sql`${roomPlayers.userId} != ${room.adminId}`));

  if (room.status === "live") {
    await db.update(rooms).set({ status: "ended", endedAt: new Date() }).where(eq(rooms.id, roomId));
  }

  await db
    .update(submissions)
    .set({ isWinner: true })
    .where(and(eq(submissions.roomId, roomId), eq(submissions.userId, winnerId)));

  const prize = room.prizePool ?? 0;
  if (prize <= 0) {
    console.warn(`[crownArenaWinner] room ${roomId} prize pool is ${prize}`);
  }

  await db
    .update(users)
    .set({
      coinsBalance: sql`${users.coinsBalance} + ${prize}`,
      xp: sql`${users.xp} + ${XP_WIN}`,
    })
    .where(eq(users.id, winnerId));

  await db.insert(coinTransactions).values({
    id: randomUUID(),
    userId: winnerId,
    amount: prize,
    type: "earned",
    reference: `room:${roomId}:winner`,
  });

  const streak = await updateConsecutiveWins(winnerId, true);
  await updateRank(winnerId);

  const [winnerSub] = await db
    .select({ submittedAt: submissions.submittedAt })
    .from(submissions)
    .where(and(eq(submissions.roomId, roomId), eq(submissions.userId, winnerId)))
    .orderBy(submissions.submittedAt)
    .limit(1);

  const solveSeconds =
    room.startedAt && winnerSub?.submittedAt
      ? Math.round(
          (new Date(winnerSub.submittedAt).getTime() - new Date(room.startedAt).getTime()) / 1000,
        )
      : null;

  const [winnerUser] = await db
    .select({ coinsBalance: users.coinsBalance, rank: users.rank, roomsCreatedCount: users.roomsCreatedCount })
    .from(users)
    .where(eq(users.id, winnerId))
    .limit(1);

  await checkAndAwardAchievements(winnerId, {
    won: true,
    roomCategory: room.category,
    solveSeconds,
    coinsBalance: winnerUser?.coinsBalance,
    rank: winnerUser?.rank,
    roomsCreatedCount: winnerUser?.roomsCreatedCount,
    consecutiveWins: streak,
  });

  for (const c of competitors) {
    if (c.userId !== winnerId) {
      await updateConsecutiveWins(c.userId, false);
      await grantParticipation(c.userId);
    }
  }

  const players = await db
    .select({ userId: roomPlayers.userId })
    .from(roomPlayers)
    .where(eq(roomPlayers.roomId, roomId));

  await Promise.all(
    players.map((p) =>
      sendNotificationToUser(p.userId, "Arena ended!", "Check the results.", {
        url: `/arena/${roomId}/results`,
      }),
    ),
  );

  return true;
}

/** If this player just completed a perfect run first, crown them immediately. */
export async function tryCrownFirstPerfectScorer(
  roomId: string,
  userId: string,
  questionCount: number,
): Promise<string | null> {
  const [room] = await db.select({ status: rooms.status }).from(rooms).where(eq(rooms.id, roomId)).limit(1);
  if (!room || room.status !== "live") return null;
  if (await hasArenaWinner(roomId)) return null;

  const hasPerfect = await userQualifiesAsMultiQuestionWinner(roomId, userId, questionCount);
  if (!hasPerfect) return null;

  const first = await findFirstPerfectScorer(roomId, questionCount);
  if (!first || first.userId !== userId) return null;

  await crownArenaWinner(roomId, userId);
  return userId;
}

/** Backfill refunds for ended/cancelled rooms that were closed before refund logic shipped. */
export async function repairMissingEntryRefunds(
  roomId: string,
  roomStatus: string,
): Promise<void> {
  if (roomStatus === "cancelled") {
    await refundEntryFeesForRoom(roomId, "cancelled_refund");
    return;
  }

  if (roomStatus !== "ended") return;
  if (await hasArenaWinner(roomId)) return;

  const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
  if (!room) return;

  const questions = getRoomQuestions(room);
  const firstPerfect = await findFirstPerfectScorer(roomId, questions.length);
  if (firstPerfect && (await userQualifiesAsMultiQuestionWinner(roomId, firstPerfect.userId, questions.length))) {
    await crownArenaWinner(roomId, firstPerfect.userId);
    return;
  }

  await refundEntryFeesForRoom(roomId, "no_winner_refund");
}

/** Refund entry fees to everyone who paid when no winner is crowned. Idempotent per refund type. */
export async function refundEntryFeesForRoom(
  roomId: string,
  refundKind: "no_winner_refund" | "cancelled_refund",
): Promise<void> {
  const refundReference = `room:${roomId}:${refundKind}`;

  const entryTxs = await db
    .select({
      userId: coinTransactions.userId,
      amount: coinTransactions.amount,
    })
    .from(coinTransactions)
    .where(
      and(
        eq(coinTransactions.reference, `room:${roomId}:entry`),
        eq(coinTransactions.type, "spent"),
      ),
    );

  for (const entry of entryTxs) {
    const [alreadyRefunded] = await db
      .select({ id: coinTransactions.id })
      .from(coinTransactions)
      .where(
        and(
          eq(coinTransactions.userId, entry.userId),
          eq(coinTransactions.reference, refundReference),
        ),
      )
      .limit(1);

    if (alreadyRefunded) continue;

    const refundAmount = Math.abs(entry.amount ?? ENTRY_FEE);

    await db
      .update(users)
      .set({ coinsBalance: sql`${users.coinsBalance} + ${refundAmount}` })
      .where(eq(users.id, entry.userId));

    await db.insert(coinTransactions).values({
      id: randomUUID(),
      userId: entry.userId,
      amount: refundAmount,
      type: "earned",
      reference: refundReference,
    });
  }
}

/** End a live room, pick winner(s), distribute coins / refunds. Idempotent if already ended. */
export async function finalizeArena(roomId: string): Promise<void> {
  const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
  if (!room || room.status !== "live") return;

  const questions = getRoomQuestions(room);
  const isMulti = questions.length > 1;

  const competitors = await db
    .select({ userId: roomPlayers.userId })
    .from(roomPlayers)
    .where(and(eq(roomPlayers.roomId, roomId), sql`${roomPlayers.userId} != ${room.adminId}`));

  if (await hasArenaWinner(roomId)) return;

  const scores = await scoreRoom(roomId);
  const topScore = scores[0]?.correct ?? 0;
  const leaders = scores.filter((s) => s.correct === topScore && topScore > 0);

  let winnerIds: string[] = [];
  let tieRefund = false;

  const firstPerfect = await findFirstPerfectScorer(roomId, questions.length);

  if (firstPerfect && (await userQualifiesAsMultiQuestionWinner(roomId, firstPerfect.userId, questions.length))) {
    winnerIds = [firstPerfect.userId];
  } else if (isMulti) {
    const perfectLeaders: ScoreRow[] = [];
    for (const leader of leaders) {
      if (await userQualifiesAsMultiQuestionWinner(roomId, leader.userId, questions.length)) {
        perfectLeaders.push(leader);
      }
    }

    if (perfectLeaders.length === 1) {
      winnerIds = [perfectLeaders[0].userId];
    } else if (perfectLeaders.length > 1) {
      tieRefund = true;
      winnerIds = perfectLeaders.map((l) => l.userId);
    }
    // Partial completion (e.g. 3/4 questions) never wins — winnerIds stays empty
  } else if (!isMulti) {
    const [existingWinner] = await db
      .select({ userId: submissions.userId })
      .from(submissions)
      .where(and(eq(submissions.roomId, roomId), eq(submissions.isWinner, true)))
      .limit(1);
    if (existingWinner) {
      winnerIds = [existingWinner.userId];
    } else if (leaders.length === 1) {
      winnerIds = [leaders[0].userId];
    }
  }

  if (winnerIds.length === 1 && !tieRefund) {
    await crownArenaWinner(roomId, winnerIds[0]);
    return;
  }

  await db.update(rooms).set({ status: "ended", endedAt: new Date() }).where(eq(rooms.id, roomId));

  if (tieRefund && winnerIds.length > 1) {
    for (const userId of winnerIds) {
      await db
        .update(users)
        .set({ coinsBalance: sql`${users.coinsBalance} + ${ENTRY_FEE}` })
        .where(eq(users.id, userId));
      await db.insert(coinTransactions).values({
        id: randomUUID(),
        userId,
        amount: ENTRY_FEE,
        type: "earned",
        reference: `room:${roomId}:tie_refund`,
      });
      await db
        .update(submissions)
        .set({ isWinner: false })
        .where(and(eq(submissions.roomId, roomId), eq(submissions.userId, userId)));
      await updateConsecutiveWins(userId, false);
      await grantParticipation(userId);
    }
  } else {
    await refundEntryFeesForRoom(roomId, "no_winner_refund");
    await db.update(rooms).set({ prizePool: 0 }).where(eq(rooms.id, roomId));
  }

  for (const c of competitors) {
    if (!winnerIds.includes(c.userId)) {
      await updateConsecutiveWins(c.userId, false);
      await grantParticipation(c.userId);
    }
  }

  const players = await db
    .select({ userId: roomPlayers.userId })
    .from(roomPlayers)
    .where(eq(roomPlayers.roomId, roomId));

  await Promise.all(
    players.map((p) =>
      sendNotificationToUser(p.userId, "Arena ended!", "Check the results.", {
        url: `/arena/${roomId}/results`,
      }),
    ),
  );
}

async function grantParticipation(userId: string) {
  await db
    .update(users)
    .set({ xp: sql`${users.xp} + ${XP_PARTICIPATION}` })
    .where(eq(users.id, userId));
  await updateRank(userId);
}

async function updateRank(userId: string) {
  const [user] = await db.select({ xp: users.xp }).from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return;

  const xp = user.xp;
  let rank: "recruit" | "challenger" | "elite" | "champion" | "legendary" = "recruit";
  if (xp >= 20000) rank = "legendary";
  else if (xp >= 7500) rank = "champion";
  else if (xp >= 2000) rank = "elite";
  else if (xp >= 500) rank = "challenger";

  await db.update(users).set({ rank }).where(eq(users.id, userId));
}

/** True when every competitor has submitted for every question (or forfeited). */
export async function allCompetitorsFinished(roomId: string, adminId: string, questionCount: number): Promise<boolean> {
  const competitors = await db
    .select({ userId: roomPlayers.userId, status: roomPlayers.status })
    .from(roomPlayers)
    .where(and(eq(roomPlayers.roomId, roomId), sql`${roomPlayers.userId} != ${adminId}`));

  if (competitors.length === 0) return false;

  for (const c of competitors) {
    if (c.status === "forfeited") continue;
    const [{ c: answered }] = await db
      .select({ c: sql<number>`count(distinct ${submissions.questionIndex})` })
      .from(submissions)
      .where(and(eq(submissions.roomId, roomId), eq(submissions.userId, c.userId)));
    if (answered < questionCount) return false;
  }

  return true;
}
