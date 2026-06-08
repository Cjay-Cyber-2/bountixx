export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rooms, roomPlayers, submissions, testCases, users, coinTransactions, achievements } from "@/lib/schema";
import { eq, and, count, sql } from "drizzle-orm";
import { getSession, unauthorized } from "@/lib/getSession";
import { randomUUID } from "crypto";
import { sendNotificationToUser } from "@/lib/sendNotification";

// Piston API for code execution
const PISTON_API = "https://emkc.org/api/v2/piston/execute";

const BOUNTY_PRIZES: Record<string, Record<number, number>> = {
  bronze: { 1: 100, 2: 40, 3: 20 },
  silver: { 1: 250, 2: 90, 3: 40 },
  gold:   { 1: 500, 2: 180, 3: 70 },
  mythic: { 1: 1500, 2: 500, 3: 200 },
};

const XP_PRIZES: Record<number, number> = { 1: 200, 2: 100, 3: 50 };

async function runTests(
  code: string,
  language: string,
  tests: { input: string; expectedOutput: string }[]
): Promise<{ passed: number; total: number; results: { pass: boolean; output: string }[] }> {
  const lang = language.toLowerCase() === "javascript" ? "javascript" : "python";
  const version = lang === "javascript" ? "18.15.0" : "3.10.0";

  const results: { pass: boolean; output: string }[] = [];

  for (const test of tests) {
    try {
      const res = await fetch(PISTON_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: lang,
          version,
          files: [{ content: code }],
          stdin: test.input,
          run_timeout: 5000,
          compile_timeout: 10000,
        }),
      });

      if (!res.ok) {
        results.push({ pass: false, output: "Execution error" });
        continue;
      }

      const data = await res.json();
      const output = (data.run?.stdout ?? "").trim();
      const expected = test.expectedOutput.trim();
      results.push({ pass: output === expected, output });
    } catch {
      results.push({ pass: false, output: "Timeout or error" });
    }
  }

  const passed = results.filter((r) => r.pass).length;
  return { passed, total: tests.length, results };
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return unauthorized();

  const { id: roomId } = await params;

  const [room] = await db
    .select()
    .from(rooms)
    .where(eq(rooms.id, roomId))
    .limit(1);

  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  if (room.status !== "live") {
    return NextResponse.json({ error: "Room is not live" }, { status: 409 });
  }
  if (room.adminId === session.id) {
    return NextResponse.json({ error: "Admin cannot submit in their own room" }, { status: 403 });
  }

  // Confirm player is in the room
  const [playerRow] = await db
    .select()
    .from(roomPlayers)
    .where(and(eq(roomPlayers.roomId, roomId), eq(roomPlayers.userId, session.id)))
    .limit(1);

  if (!playerRow) return NextResponse.json({ error: "You are not in this room" }, { status: 403 });

  const body = await req.json() as {
    code?: string;
    answer?: string;
    language?: string;
    runTestsOnly?: boolean;
  };

  // ── Coding room ──────────────────────────────────────────────────────────
  if (room.category === "coding") {
    if (!body.code) return NextResponse.json({ error: "Code is required" }, { status: 400 });

    const allTests = await db
      .select()
      .from(testCases)
      .where(and(eq(testCases.roomId, roomId), eq(testCases.isActive, true)));

    if (body.runTestsOnly) {
      // Only run public tests for preview
      const publicTests = allTests.filter((t) => !t.isHidden);
      const result = await runTests(body.code, body.language ?? "javascript", publicTests);
      return NextResponse.json({ testResults: result, runOnly: true });
    }

    // Full submission — run hidden tests
    const hiddenTests = allTests.filter((t) => t.isHidden);
    const testResult = await runTests(body.code, body.language ?? "javascript", hiddenTests);

    const isWinner = testResult.passed === testResult.total && testResult.total > 0;

    // Check if someone already won
    const [existingWinner] = await db
      .select({ id: submissions.id })
      .from(submissions)
      .where(and(eq(submissions.roomId, roomId), eq(submissions.isWinner, true)))
      .limit(1);

    const [submission] = await db
      .insert(submissions)
      .values({
        id:          randomUUID(),
        roomId,
        userId:      session.id,
        code:        body.code,
        language:    body.language ?? "javascript",
        testsPassed: testResult.passed,
        testsTotal:  testResult.total,
        isWinner:    isWinner && !existingWinner,
      })
      .returning();

    // Mark player as completed
    await db
      .update(roomPlayers)
      .set({ status: "completed", submittedAt: new Date() })
      .where(and(eq(roomPlayers.roomId, roomId), eq(roomPlayers.userId, session.id)));

    if (isWinner && !existingWinner) {
      await grantWinnerRewards(room.id, session.id, room.bountyTier, 1);
      // End the room
      await db.update(rooms).set({ status: "ended", endedAt: new Date() }).where(eq(rooms.id, roomId));
      // Notify all players that the arena ended
      const players = await db
        .select({ userId: roomPlayers.userId })
        .from(roomPlayers)
        .where(eq(roomPlayers.roomId, roomId));
      await Promise.all(
        players.map((p) =>
          sendNotificationToUser(p.userId, "Arena ended!", "Check the results.", { url: `/arena/${roomId}` })
        )
      );
    } else {
      // XP for participation
      await grantParticipationRewards(session.id);
    }

    return NextResponse.json({
      submission,
      testResults: testResult,
      won: isWinner && !existingWinner,
    });
  }

  // ── Trivia / Logic / Math rooms ──────────────────────────────────────────
  if (!body.answer) return NextResponse.json({ error: "Answer is required" }, { status: 400 });

  // Get canonical answer (stored in room.taskNormalised as a special field, or check separately)
  // For now, admin can mark answers; simple string comparison
  const canonicalAnswer = room.taskNormalised?.includes("ANSWER:")
    ? room.taskNormalised.split("ANSWER:")[1]?.split("\n")[0]?.trim()
    : null;

  const isCorrect = canonicalAnswer
    ? body.answer.trim().toLowerCase() === canonicalAnswer.toLowerCase()
    : false;

  const [existingWinner] = await db
    .select({ id: submissions.id })
    .from(submissions)
    .where(and(eq(submissions.roomId, roomId), eq(submissions.isWinner, true)))
    .limit(1);

  const isWinner = isCorrect && !existingWinner;

  const [submission] = await db
    .insert(submissions)
    .values({
      id:       randomUUID(),
      roomId,
      userId:   session.id,
      answer:   body.answer,
      isWinner,
      testsPassed: isCorrect ? 1 : 0,
      testsTotal:  1,
    })
    .returning();

  await db
    .update(roomPlayers)
    .set({ status: "completed", submittedAt: new Date() })
    .where(and(eq(roomPlayers.roomId, roomId), eq(roomPlayers.userId, session.id)));

  if (isWinner) {
    await grantWinnerRewards(room.id, session.id, room.bountyTier, 1);
    await db.update(rooms).set({ status: "ended", endedAt: new Date() }).where(eq(rooms.id, roomId));
    // Notify all players that the arena ended
    const players = await db
      .select({ userId: roomPlayers.userId })
      .from(roomPlayers)
      .where(eq(roomPlayers.roomId, roomId));
    await Promise.all(
      players.map((p) =>
        sendNotificationToUser(p.userId, "Arena ended!", "Check the results.", { url: `/arena/${roomId}` })
      )
    );
  } else {
    await grantParticipationRewards(session.id);
  }

  return NextResponse.json({
    submission,
    correct: isCorrect,
    won: isWinner,
  });
}

async function grantWinnerRewards(
  roomId: string,
  userId: string,
  bountyTier: string,
  placement: number
) {
  const prizeTable = BOUNTY_PRIZES[bountyTier] ?? BOUNTY_PRIZES["bronze"];
  const coins = prizeTable[placement] ?? 10;
  const xp = XP_PRIZES[placement] ?? 25;

  await db.update(users).set({
    coinsBalance: sql`${users.coinsBalance} + ${coins}`,
    xp:           sql`${users.xp} + ${xp}`,
  }).where(eq(users.id, userId));

  await db.insert(coinTransactions).values({
    id:        randomUUID(),
    userId,
    amount:    coins,
    type:      "earned",
    reference: `room:${roomId}:place:${placement}`,
  });

  // Check + award First Blood badge
  const [existing] = await db
    .select({ id: achievements.id })
    .from(achievements)
    .where(and(eq(achievements.userId, userId), eq(achievements.badgeId, "first_blood")))
    .limit(1);

  if (!existing) {
    await db.insert(achievements).values({
      id:      randomUUID(),
      userId,
      badgeId: "first_blood",
    });
  }

  // Update rank
  await updateRank(userId);
}

async function grantParticipationRewards(userId: string) {
  const XP_PARTICIPATION = 25;
  const COINS_PARTICIPATION = 10;

  await db.update(users).set({
    coinsBalance: sql`${users.coinsBalance} + ${COINS_PARTICIPATION}`,
    xp:           sql`${users.xp} + ${XP_PARTICIPATION}`,
  }).where(eq(users.id, userId));

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
  else if (xp >= 500)  rank = "challenger";

  await db.update(users).set({ rank }).where(eq(users.id, userId));
}
