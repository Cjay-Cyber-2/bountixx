export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rooms, roomPlayers, invites } from "@/lib/schema";
import { eq, ne, count, and } from "drizzle-orm";
import { getSession, unauthorized } from "@/lib/getSession";
import { expireLobbyIfStale } from "@/lib/roomExpiry";
import { ENTRY_FEE, hasAffordableEntry, isEntryFeeExempt } from "@/lib/coins";
import { randomUUID } from "crypto";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(req);
  if (!session) return unauthorized();

  const { id: roomId } = await params;

  const [room] = await db
    .select()
    .from(rooms)
    .where(eq(rooms.id, roomId))
    .limit(1);

  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  if (await expireLobbyIfStale(room)) {
    return NextResponse.json({ error: "This invite link has expired" }, { status: 404 });
  }

  const entryExempt = isEntryFeeExempt(session.id, room.adminId, session.email);
  if (
    session.id !== room.adminId &&
    !entryExempt &&
    !hasAffordableEntry(session.coinsBalance ?? 0, session.email)
  ) {
    return NextResponse.json(
      {
        error: `You need at least ${ENTRY_FEE} coins to compete in this arena. Open your Wallet to get more coins.`,
        code: "INSUFFICIENT_COINS",
      },
      { status: 402 },
    );
  }

  const [existing] = await db
    .select({ id: roomPlayers.id })
    .from(roomPlayers)
    .where(and(eq(roomPlayers.roomId, roomId), eq(roomPlayers.userId, session.id)))
    .limit(1);

  if (existing) {
    await db
      .update(invites)
      .set({ status: "accepted" })
      .where(and(eq(invites.roomId, roomId), eq(invites.inviteeId, session.id)));

    if (room.status === "live") {
      return NextResponse.json({ message: "Already in this room", roomStatus: "live", redirectTo: `/arena/${roomId}` });
    }
    if (room.status === "ended" || room.status === "cancelled") {
      return NextResponse.json({ message: "Already in this room", roomStatus: room.status, redirectTo: `/arena/${roomId}/results` });
    }
    return NextResponse.json({ message: "Already in this room", roomStatus: "lobby", redirectTo: `/lobby/${roomId}` });
  }

  if (room.status !== "lobby") {
    return NextResponse.json(
      { error: "Room is no longer accepting players", roomStatus: room.status },
      { status: 409 },
    );
  }

  const [{ count: playerCount }] = await db
    .select({ count: count() })
    .from(roomPlayers)
    .where(and(
      eq(roomPlayers.roomId, roomId),
      ne(roomPlayers.userId, room.adminId)
    ));

  if (playerCount >= room.playerCap) {
    return NextResponse.json({ error: "Room is full" }, { status: 409 });
  }

  const [player] = await db
    .insert(roomPlayers)
    .values({
      id:       randomUUID(),
      roomId,
      userId:   session.id,
      status:   "joined",
      joinedAt: new Date(),
    })
    .returning();

  await db
    .update(invites)
    .set({ status: "accepted" })
    .where(and(eq(invites.roomId, roomId), eq(invites.inviteeId, session.id)));

  return NextResponse.json({ player, roomStatus: "lobby", redirectTo: `/lobby/${roomId}` }, { status: 201 });
}
