export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rooms, roomPlayers, testCases, users, submissions } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { getSession, unauthorized } from "@/lib/getSession";

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

  // Players in the room
  const players = await db
    .select({
      id:       roomPlayers.id,
      userId:   roomPlayers.userId,
      status:   roomPlayers.status,
      joinedAt: roomPlayers.joinedAt,
      username: users.username,
      avatarUrl: users.avatarUrl,
      rank:     users.rank,
    })
    .from(roomPlayers)
    .leftJoin(users, eq(roomPlayers.userId, users.id))
    .where(eq(roomPlayers.roomId, id));

  // Test cases — only public unless this is the admin
  const isAdmin = room.adminId === session.id;
  const testCaseRows = room.category === "coding"
    ? await db
        .select()
        .from(testCases)
        .where(and(
          eq(testCases.roomId, id),
          eq(testCases.isActive, true),
          // Non-admins only see public tests while room is live
          ...(isAdmin || room.status === "ended" ? [] : [eq(testCases.isHidden, false)])
        ))
    : [];

  // User's submission (if any)
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
  if (status === "live")    updates.startedAt = new Date();
  if (status === "ended")   updates.endedAt   = new Date();
  if (status === "cancelled") updates.endedAt = new Date();

  const [updated] = await db
    .update(rooms)
    .set(updates)
    .where(eq(rooms.id, id))
    .returning();

  return NextResponse.json({ room: updated });
}
