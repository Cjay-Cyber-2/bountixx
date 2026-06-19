export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rooms, roomPlayers } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { getSession, unauthorized } from "@/lib/getSession";
import { ENTRY_FEE, hasAffordableEntry, isEntryFeeExempt } from "@/lib/coins";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return unauthorized();

  const { id: roomId } = await params;

  const [room] = await db
    .select({ id: rooms.id, status: rooms.status, adminId: rooms.adminId })
    .from(rooms)
    .where(eq(rooms.id, roomId))
    .limit(1);

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }
  if (room.status !== "lobby") {
    return NextResponse.json({ error: "Room is not in lobby" }, { status: 409 });
  }

  const [playerRow] = await db
    .select({ id: roomPlayers.id, status: roomPlayers.status })
    .from(roomPlayers)
    .where(and(eq(roomPlayers.roomId, roomId), eq(roomPlayers.userId, session.id)))
    .limit(1);

  if (!playerRow) {
    return NextResponse.json({ error: "You are not in this room" }, { status: 403 });
  }

  const newStatus: "joined" | "ready" =
    playerRow.status === "ready" ? "joined" : "ready";

  if (
    newStatus === "ready" &&
    session.id !== room.adminId &&
    !isEntryFeeExempt(session.id, room.adminId, session.email) &&
    !hasAffordableEntry(session.coinsBalance ?? 0, session.email)
  ) {
    return NextResponse.json(
      {
        error: `You need at least ${ENTRY_FEE} coins before you can ready up. Open your Wallet to get more coins.`,
        code: "INSUFFICIENT_COINS",
      },
      { status: 402 },
    );
  }

  await db
    .update(roomPlayers)
    .set({ status: newStatus })
    .where(eq(roomPlayers.id, playerRow.id));

  // Compute allReady: all players must be "ready"
  const allPlayers = await db
    .select({ status: roomPlayers.status })
    .from(roomPlayers)
    .where(eq(roomPlayers.roomId, roomId));

  const playerCount = allPlayers.length;
  const allReady =
    playerCount >= 2 && allPlayers.every((p) => p.status === "ready");

  return NextResponse.json({ status: newStatus, allReady, playerCount });
}
