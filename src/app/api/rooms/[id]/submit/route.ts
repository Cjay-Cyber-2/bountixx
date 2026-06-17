export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rooms, roomPlayers, submissions, testCases, users, coinTransactions, achievements } from "@/lib/schema";
import { eq, and, count, sql } from "drizzle-orm";
import { getSession, unauthorized } from "@/lib/getSession";
import { randomUUID } from "crypto";
import { sendNotificationToUser } from "@/lib/sendNotification";
import { runCode } from "@/lib/codeRunner";

const XP_WIN = 200;
const XP_PARTICIPATION = 25;

async function runTests(
  code: string,
  language: string,
  tests: { input: string; expectedOutput: string }[]
): Promise<{ passed: number; total: number; results: { pass: boolean; output: string }[] }> {
  const results: { pass: boolean; output: string }[] = [];

  for (const test of tests) {
    try {
      const run = await runCode({ language, source: code, stdin: test.input });
      const output = (run.stdout ?? "").trim();
      const expected = test.expectedOutput.trim();
      // A run that errored out (non-zero exit / compile error) never passes.
      results.push({ pass: run.ok && output === expected, output: output || run.stderr.trim().slice(0, 200) || (run.timedOut ? "Timed out" : "No output") });
    } catch {
      results.push({ pass: false, output: "Execution service error" });
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
  // The host set the answer — they referee, they can't submit
  if (room.adminId === session.id) {
    return NextResponse.json({ error: "The host cannot compete in their own arena" }, { status: 403 });
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

  // Anti-cheat forfeit: mark the player disqualified, no submission recorded
  if (body.answer === "__forfeit__") {
    await db
      .update(roomPlayers)
      .set({ status: "forfeited", submittedAt: new Date() })
      .where(and(eq(roomPlayers.roomId, roomId), eq(roomPlayers.userId, session.id)));
    return NextResponse.json({ forfeited: true });
  }

  // Integrity guard: once a player has completed or forfeited, no more recorded
  // submissions. This stops XP farming and answer brute-forcing on a second try.
  // Preview-only test runs (runTestsOnly) are still allowed since they record nothing.
  if (
    !body.runTestsOnly &&
    (playerRow.status === "completed" || playerRow.status === "forfeited")
  ) {
    return NextResponse.json(
      { error: "You have already submitted in this arena" },
      { status: 409 }
    );
  }

  // ── Coding room ──────────────────────────────────────────────────────────
  if (room.category === "coding") {
    if (!body.code) return NextResponse.json({ error: "Code is required" }, { status: 400 });

    const { codeExecutionEnabled } = await import("@/lib/codeRunner");
    if (!codeExecutionEnabled()) {
      return NextResponse.json(
        { error: "Code execution is not configured. The room host must set a JUDGE0_URL (or PISTON_URL) — see user_task.md." },
        { status: 503 }
      );
    }

    // The room's analysed language is authoritative (the editor is locked to it).
    const lang = room.language ?? body.language ?? "javascript";

    const allTests = await db
      .select()
      .from(testCases)
      .where(and(eq(testCases.roomId, roomId), eq(testCases.isActive, true)));

    if (body.runTestsOnly) {
      // Only run public tests for preview
      const publicTests = allTests.filter((t) => !t.isHidden);
      const result = await runTests(body.code, lang, publicTests);
      return NextResponse.json({ testResults: result, runOnly: true });
    }

    // Full submission — run hidden tests
    const hiddenTests = allTests.filter((t) => t.isHidden);
    const testResult = await runTests(body.code, lang, hiddenTests);

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
        language:    lang,
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
      await grantWinnerRewards(room.id, session.id, room.prizePool ?? 0);
      await db.update(rooms).set({ status: "ended", endedAt: new Date() }).where(eq(rooms.id, roomId));
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
      testResults: testResult,
      won: isWinner && !existingWinner,
    });
  }

  // ── Trivia / Logic / Math rooms ──────────────────────────────────────────
  if (!body.answer) return NextResponse.json({ error: "Answer is required" }, { status: 400 });

  // Judge against the canonical answer the creator approved (and possibly edited)
  // before the room was created. Legacy fallback: "ANSWER:" embedded in taskNormalised.
  const canonicalAnswer =
    room.canonicalAnswer?.trim() ||
    (room.taskNormalised?.includes("ANSWER:")
      ? room.taskNormalised.split("ANSWER:")[1]?.split("\n")[0]?.trim()
      : null);

  const normalise = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  const isCorrect = canonicalAnswer
    ? normalise(body.answer) === normalise(canonicalAnswer)
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
    await grantWinnerRewards(room.id, session.id, room.prizePool ?? 0);
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
  prizePool: number
) {
  await db.update(users).set({
    coinsBalance: sql`${users.coinsBalance} + ${prizePool}`,
    xp:           sql`${users.xp} + ${XP_WIN}`,
  }).where(eq(users.id, userId));

  await db.insert(coinTransactions).values({
    id:        randomUUID(),
    userId,
    amount:    prizePool,
    type:      "earned",
    reference: `room:${roomId}:winner`,
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
  await db.update(users).set({
    xp: sql`${users.xp} + ${XP_PARTICIPATION}`,
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
