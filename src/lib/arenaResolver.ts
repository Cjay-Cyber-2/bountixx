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

  const scores = await scoreRoom(roomId);
  const topScore = scores[0]?.correct ?? 0;
  const leaders = scores.filter((s) => s.correct === topScore && topScore > 0);

  let winnerIds: string[] = [];
  let tieRefund = false;

  if (isMulti) {
    if (leaders.length === 1) {
      winnerIds = [leaders[0].userId];
    } else if (leaders.length > 1) {
      tieRefund = true;
      winnerIds = leaders.map((l) => l.userId);
    }
  } else {
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
  } else if (winnerIds.length === 1) {
    const winnerId = winnerIds[0];
    await db
      .update(submissions)
      .set({ isWinner: true })
      .where(and(eq(submissions.roomId, roomId), eq(submissions.userId, winnerId)));

    const prize = room.prizePool ?? 0;
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
