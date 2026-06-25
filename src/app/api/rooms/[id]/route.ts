export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rooms, roomPlayers, testCases, users, submissions, coinTransactions } from "@/lib/schema";
import { eq, and, sql } from "drizzle-orm";
import { getSession, unauthorized } from "@/lib/getSession";
import { getRoomQuestions } from "@/lib/roomQuestions";
import { expireLobbyIfStale } from "@/lib/roomExpiry";
import { ENTRY_FEE, isEntryFeeExempt, hasAffordableEntry } from "@/lib/coins";
import { finalizeArena, refundEntryFeesForRoom, repairMissingEntryRefunds } from "@/lib/arenaResolver";
import { serializeArenaTimer } from "@/lib/arenaTimer";
import { randomUUID } from "crypto";

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

  if (await expireLobbyIfStale(room)) {
    return NextResponse.json({ error: "This arena link has expired" }, { status: 404 });
  }

  let liveRoom = room;
  let timer = serializeArenaTimer(liveRoom.timerSeconds, liveRoom.startedAt);

  if (liveRoom.status === "live" && timer.hasTimer && timer.expired) {
    await finalizeArena(id);
    const [refreshed] = await db.select().from(rooms).where(eq(rooms.id, id)).limit(1);
    if (refreshed) {
      liveRoom = refreshed;
      timer = serializeArenaTimer(liveRoom.timerSeconds, liveRoom.startedAt);
    }
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

  const isAdmin = liveRoom.adminId === session.id;
  const testCaseRows = liveRoom.category === "coding"
    ? await db
        .select()
        .from(testCases)
        .where(and(
          eq(testCases.roomId, id),
          eq(testCases.isActive, true),
          ...(isAdmin || liveRoom.status === "ended" ? [] : [eq(testCases.isHidden, false)])
        ))
    : [];

  const [userSubmission] = await db
    .select()
    .from(submissions)
    .where(and(eq(submissions.roomId, id), eq(submissions.userId, session.id)))
    .limit(1);

  // Real final standings once the room is over — winner first, then by submission time
  let results: {
    userId: string;
    username: string | null;
    isWinner: boolean;
    testsPassed: number;
    testsTotal: number;
    submittedAt: Date | null;
  }[] = [];

  if (liveRoom.status === "ended" || liveRoom.status === "cancelled") {
    await repairMissingEntryRefunds(id, liveRoom.status);

    const subRows = await db
      .select({
        userId:      submissions.userId,
        username:    users.username,
        isWinner:    submissions.isWinner,
        testsPassed: submissions.testsPassed,
        testsTotal:  submissions.testsTotal,
        submittedAt: submissions.submittedAt,
      })
      .from(submissions)
      .leftJoin(users, eq(submissions.userId, users.id))
      .where(eq(submissions.roomId, id));

    results = subRows.sort((a, b) => {
      if (a.isWinner !== b.isWinner) return a.isWinner ? -1 : 1;
      return new Date(a.submittedAt ?? 0).getTime() - new Date(b.submittedAt ?? 0).getTime();
    });
  }

  return NextResponse.json({
    room: {
      ...liveRoom,
      startedAt: liveRoom.startedAt?.toISOString?.() ?? liveRoom.startedAt ?? null,
      createdAt: liveRoom.createdAt?.toISOString?.() ?? liveRoom.createdAt,
      endedAt: liveRoom.endedAt?.toISOString?.() ?? liveRoom.endedAt ?? null,
    },
    players,
    testCases: testCaseRows,
    mySubmission: userSubmission ?? null,
    isAdmin,
    results,
    questions: getRoomQuestions(liveRoom),
    totalQuestions: getRoomQuestions(liveRoom).length,
    timer,
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
    // 1. Fetch all players with their current coin balance + email
    const playerRows = await db
      .select({
        playerId:     roomPlayers.id,
        userId:       roomPlayers.userId,
        coinsBalance: users.coinsBalance,
        username:     users.username,
        email:        users.email,
      })
      .from(roomPlayers)
      .leftJoin(users, eq(roomPlayers.userId, users.id))
      .where(eq(roomPlayers.roomId, id));

    // Exempt from the entry fee and never kicked:
    //  - the room host (they referee, they don't compete)
    //  - the unlimited owner account
    const isExempt = (p: { userId: string; email: string | null }) =>
      isEntryFeeExempt(p.userId, room.adminId, p.email);

    const competitors = playerRows.filter((p) => p.userId !== room.adminId);
    const broke = competitors.filter(
      (p) => !hasAffordableEntry(p.coinsBalance ?? 0, p.email) && !isExempt(p),
    );
    const eligible = competitors.filter(
      (p) => hasAffordableEntry(p.coinsBalance ?? 0, p.email) || isExempt(p),
    );

    // 2. Remove broke players from the room
    for (const p of broke) {
      await db
        .delete(roomPlayers)
        .where(and(eq(roomPlayers.roomId, id), eq(roomPlayers.userId, p.userId)));
    }

    // 3. Need at least 2 eligible competitors (host excluded) to run a game
    if (eligible.length < 2) {
      return NextResponse.json(
        {
          error: `Not enough players with ${ENTRY_FEE}+ coins. ${eligible.length} competitor${eligible.length === 1 ? "" : "s"} can afford the entry fee — need at least 2 (you, the host, don't count).`,
          removedPlayers: broke.map((p) => p.username),
        },
        { status: 402 }
      );
    }

    // 4. Deduct entry fee from every paying competitor — fees fund the bounty pool
    for (const p of eligible) {
      if (isExempt(p)) continue;

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

    // 5. Prize pool = sum of fees actually paid
    const paidCount = eligible.filter((p) => !isExempt(p)).length;
    updates.prizePool = ENTRY_FEE * paidCount;
    updates.startedAt = new Date();
  }

  if (status === "ended") {
    if (room.status === "live") {
      await finalizeArena(id);
      const [updated] = await db.select().from(rooms).where(eq(rooms.id, id)).limit(1);
      return NextResponse.json({ room: updated });
    }
    updates.endedAt = new Date();
  }

  if (status === "cancelled") {
    if (room.status === "live") {
      await refundEntryFeesForRoom(id, "cancelled_refund");
      await db.update(rooms).set({ prizePool: 0 }).where(eq(rooms.id, id));
    }
    updates.endedAt = new Date();
  }

  const [updated] = await db
    .update(rooms)
    .set(updates)
    .where(eq(rooms.id, id))
    .returning();

  return NextResponse.json({ room: updated });
}
