export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rooms, invites, users } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { getSession, unauthorized } from "@/lib/getSession";
import { randomUUID } from "crypto";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return unauthorized();

  const { id: roomId } = await params;
  const { inviteeIds } = await req.json() as { inviteeIds: string[] };

  if (!Array.isArray(inviteeIds) || inviteeIds.length === 0) {
    return NextResponse.json({ error: "inviteeIds array required" }, { status: 400 });
  }

  const [room] = await db
    .select({ adminId: rooms.adminId, status: rooms.status })
    .from(rooms)
    .where(eq(rooms.id, roomId))
    .limit(1);

  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  if (room.adminId !== session.id) {
    return NextResponse.json({ error: "Only the admin can invite players" }, { status: 403 });
  }
  if (room.status !== "lobby") {
    return NextResponse.json({ error: "Room is no longer in lobby" }, { status: 409 });
  }

  const created: string[] = [];

  for (const inviteeId of inviteeIds) {
    if (inviteeId === session.id) continue; // Can't invite yourself

    // Check invitee exists
    const [invitee] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, inviteeId))
      .limit(1);
    if (!invitee) continue;

    // Check for existing invite
    const [existing] = await db
      .select({ id: invites.id })
      .from(invites)
      .where(and(
        eq(invites.roomId, roomId),
        eq(invites.inviteeId, inviteeId),
      ))
      .limit(1);
    if (existing) continue;

    await db.insert(invites).values({
      id:         randomUUID(),
      roomId,
      inviterId:  session.id,
      inviteeId,
      status:     "pending",
    });
    created.push(inviteeId);
  }

  return NextResponse.json({ invited: created.length, ids: created });
}
