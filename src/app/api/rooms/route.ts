export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rooms, roomPlayers, users } from "@/lib/schema";
import { eq, desc, sql } from "drizzle-orm";
// sql kept for roomsCreatedCount increment
import { getSession, unauthorized } from "@/lib/getSession";
import { randomUUID } from "crypto";

type Category = "coding" | "trivia" | "logic" | "math" | "writing" | "design" | "meme";
type Difficulty = "rookie" | "challenger" | "elite" | "legendary";
type BountyTier = "bronze" | "silver" | "gold" | "mythic";

export interface RoomQuestion {
  index: number;
  taskRaw: string;
  taskNormalised?: string;
  canonicalAnswer?: string;
  category?: Category;
  title?: string;
  difficulty?: Difficulty;
  starterCode?: string;
  publicTests?: { input: string; expectedOutput: string }[];
  hiddenTests?: { input: string; expectedOutput: string }[];
}

export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();

  const created = await db
    .select()
    .from(rooms)
    .where(eq(rooms.adminId, session.id))
    .orderBy(desc(rooms.createdAt))
    .limit(20);

  const participated = await db
    .select({ room: rooms })
    .from(roomPlayers)
    .leftJoin(rooms, eq(roomPlayers.roomId, rooms.id))
    .where(eq(roomPlayers.userId, session.id))
    .orderBy(desc(roomPlayers.joinedAt))
    .limit(20);

  const allRooms = [
    ...created,
    ...participated.map((p) => p.room).filter(Boolean),
  ].filter((r, i, arr) => arr.findIndex((x) => x?.id === r?.id) === i);

  return NextResponse.json({ rooms: allRooms });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const body = await req.json() as {
      name: string;
      playerCap: number;
      timerSeconds?: number;
      bountyTier?: BountyTier;
      // Single-question fields (backward compat)
      taskRaw?: string;
      taskNormalised?: string;
      canonicalAnswer?: string;
      category?: Category;
      title?: string;
      difficulty?: Difficulty;
      // Multi-question array (new)
      questions?: RoomQuestion[];
    };

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Arena name is required" }, { status: 400 });
    }

    // Resolve questions array: use multi-question array if provided, otherwise wrap single question
    const questions: RoomQuestion[] = body.questions?.length
      ? body.questions
      : body.taskRaw?.trim()
      ? [
          {
            index: 0,
            taskRaw: body.taskRaw.trim(),
            taskNormalised: body.taskNormalised,
            canonicalAnswer: body.canonicalAnswer,
            category: body.category,
            title: body.title,
            difficulty: body.difficulty,
          },
        ]
      : [];

    if (questions.length === 0) {
      return NextResponse.json({ error: "At least one question is required" }, { status: 400 });
    }

    // Room creation is FREE — entry fee (50 coins/player) is collected at game start
    const roomId = randomUUID();

    // First question fields go into top-level columns for backward compat
    const first = questions[0];

    const [room] = await db
      .insert(rooms)
      .values({
        id:              roomId,
        name:            body.name.trim(),
        taskRaw:         first.taskRaw,
        taskNormalised:  first.taskNormalised,
        canonicalAnswer: first.canonicalAnswer,
        category:        first.category,
        title:           first.title,
        difficulty:      first.difficulty,
        status:          "lobby",
        adminId:         session.id,
        playerCap:       Math.min(20, Math.max(2, body.playerCap ?? 2)),
        timerSeconds:    body.timerSeconds,
        bountyTier:      body.bountyTier ?? "bronze",
        prizePool:       0,
        questionsJson:   questions.length > 1 ? JSON.stringify(questions) : null,
      })
      .returning();

    await db
      .update(users)
      .set({ roomsCreatedCount: sql`${users.roomsCreatedCount} + 1` })
      .where(eq(users.id, session.id));

    // Admin is auto-added as "ready" so they don't block the allReady check
    await db.insert(roomPlayers).values({
      id:       randomUUID(),
      roomId:   roomId,
      userId:   session.id,
      status:   "ready",
      joinedAt: new Date(),
    });

    return NextResponse.json({ room }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/rooms]", err);
    return NextResponse.json(
      { error: "Failed to create arena. Please try again." },
      { status: 500 }
    );
  }
}
