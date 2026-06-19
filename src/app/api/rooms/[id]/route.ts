export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rooms, roomPlayers, testCases, users, submissions, coinTransactions } from "@/lib/schema";
import { eq, and, sql } from "drizzle-orm";
import { getSession, unauthorized } from "@/lib/getSession";
import { getRoomQuestions } from "@/lib/roomQuestions";
import { expireLobbyIfStale } from "@/lib/roomExpiry";
import { ENTRY_FEE, isEntryFeeExempt, hasAffordableEntry } from "@/lib/coins";
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

  // Real final standings once the room is over — winner first, then by submission time
  let results: {
    userId: string;
    username: string | null;
    isWinner: boolean;
    testsPassed: number;
    testsTotal: number;
    submittedAt: Date | null;
  }[] = [];

  if (room.status === "ended" || room.status === "cancelled") {
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
    room,
    players,
    testCases: testCaseRows,
    mySubmission: userSubmission ?? null,
    isAdmin,
    results,
    questions: getRoomQuestions(room),
    totalQuestions: getRoomQuestions(room).length,
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

    // 4. Deduct 50 coins from every paying competitor
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

  if (status === "ended")    updates.endedAt = new Date();
  if (status === "cancelled") updates.endedAt = new Date();

  const [updated] = await db
    .update(rooms)
    .set(updates)
    .where(eq(rooms.id, id))
    .returning();

  return NextResponse.json({ room: updated });
}
