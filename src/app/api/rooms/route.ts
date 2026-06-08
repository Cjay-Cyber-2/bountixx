export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rooms, roomPlayers, users } from "@/lib/schema";
import { eq, desc, sql } from "drizzle-orm";
import { getSession, unauthorized } from "@/lib/getSession";
import { randomUUID } from "crypto";

export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();

  // Rooms created by user + rooms user participated in
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

  const body = await req.json() as {
    name: string;
    taskRaw: string;
    playerCap: number;
    timerSeconds?: number;
    bountyTier?: "bronze" | "silver" | "gold" | "mythic";
    // AI analysis result fields
    taskNormalised?: string;
    category?: "coding" | "trivia" | "logic" | "math" | "writing" | "design" | "meme";
    title?: string;
    difficulty?: "rookie" | "challenger" | "elite" | "legendary";
  };

  if (!body.name?.trim() || !body.taskRaw?.trim()) {
    return NextResponse.json({ error: "Name and task are required" }, { status: 400 });
  }

  // Every room creation costs coins — no free quota
  const tier = body.bountyTier ?? "bronze";
  const costs: Record<string, number> = { bronze: 50, silver: 100, gold: 150, mythic: 400 };
  const cost = costs[tier] ?? 50;

  if (session.coinsBalance < cost) {
    return NextResponse.json(
      { error: `Not enough coins. You need ${cost} coins to create this arena.` },
      { status: 402 }
    );
  }

  // Deduct coins
  await db
    .update(users)
    .set({ coinsBalance: sql`${users.coinsBalance} - ${cost}` })
    .where(eq(users.id, session.id));

  const roomId = randomUUID();

  const [room] = await db
    .insert(rooms)
    .values({
      id:            roomId,
      name:          body.name.trim(),
      taskRaw:       body.taskRaw.trim(),
      taskNormalised: body.taskNormalised,
      category:      body.category,
      title:         body.title,
      difficulty:    body.difficulty,
      status:        "lobby",
      adminId:       session.id,
      playerCap:     Math.min(20, Math.max(2, body.playerCap ?? 2)),
      timerSeconds:  body.timerSeconds,
      bountyTier:    body.bountyTier ?? "bronze",
    })
    .returning();

  // Increment rooms created count
  await db
    .update(users)
    .set({ roomsCreatedCount: sql`${users.roomsCreatedCount} + 1` })
    .where(eq(users.id, session.id));

  // Add admin as a room player (joined + ready)
  await db.insert(roomPlayers).values({
    id:       randomUUID(),
    roomId:   roomId,
    userId:   session.id,
    status:   "joined",
    joinedAt: new Date(),
  });

  return NextResponse.json({ room }, { status: 201 });
}
