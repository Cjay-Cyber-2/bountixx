export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rooms, roomPlayers } from "@/lib/schema";
import { eq, count, and } from "drizzle-orm";
import { getSession, unauthorized } from "@/lib/getSession";
import { randomUUID } from "crypto";

export async function POST(
  _req: Request,
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
  if (room.status !== "lobby") {
    return NextResponse.json({ error: "Room is no longer accepting players" }, { status: 409 });
  }

  // Check if already a player
  const [existing] = await db
    .select({ id: roomPlayers.id })
    .from(roomPlayers)
    .where(and(eq(roomPlayers.roomId, roomId), eq(roomPlayers.userId, session.id)))
    .limit(1);

  if (existing) {
    return NextResponse.json({ message: "Already in this room" });
  }

  // Check cap
  const [{ count: playerCount }] = await db
    .select({ count: count() })
    .from(roomPlayers)
    .where(eq(roomPlayers.roomId, roomId));

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

  return NextResponse.json({ player }, { status: 201 });
}
