export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rooms, roomPlayers, testCases, users, submissions, coinTransactions } from "@/lib/schema";
import { eq, and, sql } from "drizzle-orm";
import { getSession, unauthorized } from "@/lib/getSession";
import { randomUUID } from "crypto";

const ENTRY_FEE = 50;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return unauthorized();

  const { id } = await params;

  const [room] = await db
    .select()
    .from(rooms)
    .where(eq(rooms.id, id))
    .limit(1);

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  const players = await db
    .select({
      id:        roomPlayers.id,
      userId:    roomPlayers.userId,
      status:    roomPlayers.status,
      joinedAt:  roomPlayers.joinedAt,
      username:  users.username,
      avatarUrl: users.avatarUrl,
      rank:      users.rank,
    })
    .from(roomPlayers)
    .leftJoin(users, eq(roomPlayers.userId, users.id))
    .where(eq(roomPlayers.roomId, id));

  const isAdmin = room.adminId === session.id;
  const testCaseRows = room.category === "coding"
    ? await db
        .select()
        .from(testCases)
        .where(and(
          eq(testCases.roomId, id),
          eq(testCases.isActive, true),
          ...(isAdmin || room.status === "ended" ? [] : [eq(testCases.isHidden, false)])
        ))
    : [];

  const [userSubmission] = await db
    .select()
    .from(submissions)
    .where(and(eq(submissions.roomId, id), eq(submissions.userId, session.id)))
    .limit(1);

  return NextResponse.json({
    room,
    players,
    testCases: testCaseRows,
    mySubmission: userSubmission ?? null,
    isAdmin,
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return unauthorized();

  const { id } = await params;

  const [room] = await db
    .select({ adminId: rooms.adminId, status: rooms.status })
    .from(rooms)
    .where(eq(rooms.id, id))
    .limit(1);

  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  if (room.adminId !== session.id) {
    return NextResponse.json({ error: "Only the admin can update this room" }, { status: 403 });
  }

  const { status } = await req.json() as { status: "live" | "ended" | "cancelled" };
  const validTransitions: Record<string, string[]> = {
    lobby: ["live", "cancelled"],
    live:  ["ended", "cancelled"],
    ended: [],
  };

  if (!validTransitions[room.status]?.includes(status)) {
    return NextResponse.json({ error: "Invalid status transition" }, { status: 400 });
  }

  const updates: Record<string, unknown> = { status };

  if (status === "live") {
    // ── Entry fee gate ────────────────────────────────────────────────────────
    // 1. Fetch all players with their current coin balance
    const playerRows = await db
      .select({
        playerId:     roomPlayers.id,
        userId:       roomPlayers.userId,
        coinsBalance: users.coinsBalance,
        username:     users.username,
      })
      .from(roomPlayers)
      .leftJoin(users, eq(roomPlayers.userId, users.id))
      .where(eq(roomPlayers.roomId, id));

    const broke = playerRows.filter((p) => (p.coinsBalance ?? 0) < ENTRY_FEE);
    const eligible = playerRows.filter((p) => (p.coinsBalance ?? 0) >= ENTRY_FEE);

    // 2. Remove broke players from the room
    for (const p of broke) {
      await db
        .delete(roomPlayers)
        .where(and(eq(roomPlayers.roomId, id), eq(roomPlayers.userId, p.userId)));
    }

    // 3. Need at least 2 eligible players to run a game
    if (eligible.length < 2) {
      return NextResponse.json(
        {
          error: `Not enough players with 50+ coins. ${eligible.length} player${eligible.length === 1 ? "" : "s"} can afford the entry fee — need at least 2.`,
          removedPlayers: broke.map((p) => p.username),
        },
        { status: 402 }
      );
    }

    // 4. Deduct 50 coins from every eligible player and record the transaction
    for (const p of eligible) {
      await db
        .update(users)
        .set({ coinsBalance: sql`${users.coinsBalance} - ${ENTRY_FEE}` })
        .where(eq(users.id, p.userId));

      await db.insert(coinTransactions).values({
        id:        randomUUID(),
        userId:    p.userId,
        amount:    -ENTRY_FEE,
        type:      "spent",
        reference: `room:${id}:entry`,
      });
    }

    // 5. Calculate and store prize pool
    const prizePool = ENTRY_FEE * eligible.length;
    updates.prizePool = prizePool;
    updates.startedAt = new Date();
  }

  if (status === "ended")    updates.endedAt = new Date();
  if (status === "cancelled") updates.endedAt = new Date();

  const [updated] = await db
    .update(rooms)
    .set(updates)
    .where(eq(rooms.id, id))
    .returning();

  return NextResponse.json({ room: updated });
}
