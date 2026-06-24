export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rooms, roomPlayers, submissions, testCases, users, coinTransactions } from "@/lib/schema";
import { eq, and, sql } from "drizzle-orm";
import { getSession, unauthorized } from "@/lib/getSession";
import { randomUUID } from "crypto";
import { runCode, codeExecutionEnabled } from "@/lib/codeRunner";
import { getRoomQuestions } from "@/lib/roomQuestions";
import { gradePlayerAnswer } from "@/lib/gradeAnswer";
import { allCompetitorsFinished, finalizeArena, tryCrownFirstPerfectScorer } from "@/lib/arenaResolver";
import { checkAndAwardAchievements, updateConsecutiveWins } from "@/lib/achievements";

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
      results.push({
        pass: run.ok && output === expected,
        output: output || run.stderr.trim().slice(0, 200) || (run.timedOut ? "Timed out" : "No output"),
      });
    } catch {
      results.push({ pass: false, output: "Execution service error" });
    }
  }

  const passed = results.filter((r) => r.pass).length;
  return { passed, total: tests.length, results };
}

async function grantSingleQuestionWinner(
  roomId: string,
  userId: string,
  prizePool: number,
  roomCategory: string | null,
  startedAt: Date | null,
) {
  await db.update(users).set({
    coinsBalance: sql`${users.coinsBalance} + ${prizePool}`,
    xp: sql`${users.xp} + ${XP_WIN}`,
  }).where(eq(users.id, userId));

  await db.insert(coinTransactions).values({
    id: randomUUID(),
    userId,
    amount: prizePool,
    type: "earned",
    reference: `room:${roomId}:winner`,
  });

  const streak = await updateConsecutiveWins(userId, true);
  await updateRank(userId);

  const [winnerSub] = await db
    .select({ submittedAt: submissions.submittedAt })
    .from(submissions)
    .where(and(eq(submissions.roomId, roomId), eq(submissions.userId, userId)))
    .limit(1);

  const solveSeconds =
    startedAt && winnerSub?.submittedAt
      ? Math.round((new Date(winnerSub.submittedAt).getTime() - new Date(startedAt).getTime()) / 1000)
      : null;

  const [winnerUser] = await db
    .select({ coinsBalance: users.coinsBalance, rank: users.rank, roomsCreatedCount: users.roomsCreatedCount })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  await checkAndAwardAchievements(userId, {
    won: true,
    roomCategory,
    solveSeconds,
    coinsBalance: winnerUser?.coinsBalance,
    rank: winnerUser?.rank,
    roomsCreatedCount: winnerUser?.roomsCreatedCount,
    consecutiveWins: streak,
  });
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
  else if (xp >= 500) rank = "challenger";

  await db.update(users).set({ rank }).where(eq(users.id, userId));
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
    return NextResponse.json({ error: "The host cannot compete in their own arena" }, { status: 403 });
  }

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
    questionIndex?: number;
  };

  if (body.answer === "__forfeit__") {
    await db
      .update(roomPlayers)
      .set({ status: "forfeited", submittedAt: new Date() })
      .where(and(eq(roomPlayers.roomId, roomId), eq(roomPlayers.userId, session.id)));

    const questions = getRoomQuestions(room);
    const finished = await allCompetitorsFinished(roomId, room.adminId, questions.length);
    if (finished) await finalizeArena(roomId);

    return NextResponse.json({ forfeited: true });
  }

  const questions = getRoomQuestions(room);
  const questionIndex = body.questionIndex ?? 0;
  const currentQuestion = questions[questionIndex];

  if (!currentQuestion) {
    return NextResponse.json({ error: "Invalid question index" }, { status: 400 });
  }

  const isMulti = questions.length > 1;

  const [existingForQuestion] = await db
    .select({ id: submissions.id })
    .from(submissions)
    .where(
      and(
        eq(submissions.roomId, roomId),
        eq(submissions.userId, session.id),
        eq(submissions.questionIndex, questionIndex),
      ),
    )
    .limit(1);

  if (!body.runTestsOnly && existingForQuestion) {
    return NextResponse.json({ error: "You already answered this question" }, { status: 409 });
  }

  if (!body.runTestsOnly && playerRow.status === "forfeited") {
    return NextResponse.json({ error: "You have been disqualified from this arena" }, { status: 409 });
  }

  const category = currentQuestion.category ?? room.category;

  if (category === "coding") {
    if (!body.code) return NextResponse.json({ error: "Code is required" }, { status: 400 });

    const lang = currentQuestion.language ?? room.language ?? body.language ?? "javascript";
    if (!codeExecutionEnabled(lang)) {
      return NextResponse.json(
        { error: "Code execution is not configured for this language. Set JDOODLE_CLIENT_ID + JDOODLE_CLIENT_SECRET (preferred), or JUDGE0_URL / PISTON_URL — JavaScript works out of the box." },
        { status: 503 },
      );
    }

    let allTests = await db
      .select()
      .from(testCases)
      .where(and(eq(testCases.roomId, roomId), eq(testCases.isActive, true)));

    if (allTests.length === 0 && isMulti) {
      const pub = currentQuestion.publicTests ?? [];
      const hid = currentQuestion.hiddenTests ?? [];
      allTests = [
        ...pub.map((t, i) => ({
          id: `pub-${i}`,
          roomId,
          input: t.input,
          expectedOutput: t.expectedOutput,
          isHidden: false,
          isActive: true,
        })),
        ...hid.map((t, i) => ({
          id: `hid-${i}`,
          roomId,
          input: t.input,
          expectedOutput: t.expectedOutput,
          isHidden: true,
          isActive: true,
        })),
      ];
    }

    if (body.runTestsOnly) {
      const publicTests = allTests.filter((t) => !t.isHidden);
      const result = await runTests(body.code, lang, publicTests);
      return NextResponse.json({ testResults: result, runOnly: true });
    }

    const hiddenTests = allTests.filter((t) => t.isHidden);
    const testResult = await runTests(body.code, lang, hiddenTests.length ? hiddenTests : allTests);
    const isCorrect = testResult.passed === testResult.total && testResult.total > 0;

    const [submission] = await db
      .insert(submissions)
      .values({
        id: randomUUID(),
        roomId,
        userId: session.id,
        questionIndex,
        code: body.code,
        language: lang,
        testsPassed: testResult.passed,
        testsTotal: testResult.total,
        isWinner: false,
      })
      .returning();

    const answeredCount = questionIndex + 1;
    const hasMore = questionIndex + 1 < questions.length;

    if (!hasMore) {
      await db
        .update(roomPlayers)
        .set({ status: "completed", submittedAt: new Date() })
        .where(and(eq(roomPlayers.roomId, roomId), eq(roomPlayers.userId, session.id)));
    }

    let won = false;

    if (!isMulti && isCorrect) {
      const [existingWinner] = await db
        .select({ id: submissions.id })
        .from(submissions)
        .where(and(eq(submissions.roomId, roomId), eq(submissions.isWinner, true)))
        .limit(1);

      if (!existingWinner) {
        won = true;
        await db.update(submissions).set({ isWinner: true }).where(eq(submissions.id, submission.id));
        await grantSingleQuestionWinner(room.id, session.id, room.prizePool ?? 0, room.category, room.startedAt);
        await db.update(rooms).set({ status: "ended", endedAt: new Date() }).where(eq(rooms.id, roomId));
      } else {
        await grantParticipationRewards(session.id);
      }
    } else if (isMulti) {
      const crowned = await tryCrownFirstPerfectScorer(roomId, session.id, questions.length);
      if (crowned === session.id) {
        won = true;
      } else {
        const finished = await allCompetitorsFinished(roomId, room.adminId, questions.length);
        if (finished) {
          await finalizeArena(roomId);
          const [winnerSub] = await db
            .select({ isWinner: submissions.isWinner })
            .from(submissions)
            .where(and(eq(submissions.roomId, roomId), eq(submissions.userId, session.id), eq(submissions.isWinner, true)))
            .limit(1);
          won = Boolean(winnerSub?.isWinner);
        }
      }
    } else {
      await grantParticipationRewards(session.id);
      if (!isMulti) {
        const finished = await allCompetitorsFinished(roomId, room.adminId, questions.length);
        if (finished) await finalizeArena(roomId);
      }
    }

    return NextResponse.json({
      submission,
      testResults: testResult,
      won,
      correct: isCorrect,
      questionsAnswered: answeredCount,
      totalQuestions: questions.length,
      nextQuestionIndex: hasMore ? questionIndex + 1 : null,
    });
  }

  if (!body.answer) return NextResponse.json({ error: "Answer is required" }, { status: 400 });

  const canonicalAnswer =
    currentQuestion.canonicalAnswer?.trim() ||
    room.canonicalAnswer?.trim() ||
    (room.taskNormalised?.includes("ANSWER:")
      ? room.taskNormalised.split("ANSWER:")[1]?.split("\n")[0]?.trim()
      : null);

  const questionText = currentQuestion.taskNormalised ?? currentQuestion.taskRaw ?? room.taskNormalised ?? room.taskRaw;

  const grade = await gradePlayerAnswer({
    question: questionText,
    category: category ?? "trivia",
    playerAnswer: body.answer,
    canonicalAnswer,
  });

  if (!grade.accepted) {
    return NextResponse.json({
      correct: false,
      accepted: false,
      verdict: grade.verdict,
      feedback: grade.feedback,
      questionsAnswered: questionIndex,
      totalQuestions: questions.length,
      nextQuestionIndex: null,
    });
  }

  const isCorrect = true;

  const [submission] = await db
    .insert(submissions)
    .values({
      id: randomUUID(),
      roomId,
      userId: session.id,
      questionIndex,
      answer: body.answer,
      isWinner: false,
      testsPassed: isCorrect ? 1 : 0,
      testsTotal: 1,
    })
    .returning();

  const answeredCount = questionIndex + 1;
  const hasMore = questionIndex + 1 < questions.length;

  if (!hasMore) {
    await db
      .update(roomPlayers)
      .set({ status: "completed", submittedAt: new Date() })
      .where(and(eq(roomPlayers.roomId, roomId), eq(roomPlayers.userId, session.id)));
  }

  let won = false;

  if (!isMulti && isCorrect) {
    const [existingWinner] = await db
      .select({ id: submissions.id })
      .from(submissions)
      .where(and(eq(submissions.roomId, roomId), eq(submissions.isWinner, true)))
      .limit(1);

    if (!existingWinner) {
      won = true;
      await db.update(submissions).set({ isWinner: true }).where(eq(submissions.id, submission.id));
      await grantSingleQuestionWinner(room.id, session.id, room.prizePool ?? 0, room.category, room.startedAt);
      await db.update(rooms).set({ status: "ended", endedAt: new Date() }).where(eq(rooms.id, roomId));
    }
  } else if (isMulti) {
    const crowned = await tryCrownFirstPerfectScorer(roomId, session.id, questions.length);
    if (crowned === session.id) {
      won = true;
    } else {
      const finished = await allCompetitorsFinished(roomId, room.adminId, questions.length);
      if (finished) {
        await finalizeArena(roomId);
        const [winnerSub] = await db
          .select({ isWinner: submissions.isWinner })
          .from(submissions)
          .where(and(eq(submissions.roomId, roomId), eq(submissions.userId, session.id), eq(submissions.isWinner, true)))
          .limit(1);
        won = Boolean(winnerSub?.isWinner);
      }
    }
  }

  return NextResponse.json({
    submission,
    correct: isCorrect,
    accepted: true,
    verdict: grade.verdict,
    feedback: grade.feedback,
    won,
    questionsAnswered: answeredCount,
    totalQuestions: questions.length,
    nextQuestionIndex: hasMore ? questionIndex + 1 : null,
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return unauthorized();

  const { id: roomId } = await params;
  const body = (await req.json().catch(() => ({}))) as { action?: string };

  if (body.action !== "finalize") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  if (room.status !== "live") {
    return NextResponse.json({ ok: true, alreadyEnded: true });
  }

  await finalizeArena(roomId);
  return NextResponse.json({ ok: true });
}
