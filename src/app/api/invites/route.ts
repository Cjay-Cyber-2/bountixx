export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invites, rooms, users } from "@/lib/schema";
import { eq, and, desc } from "drizzle-orm";
import { getSession, unauthorized } from "@/lib/getSession";

export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();

  const pendingInvites = await db
    .select({
      id:          invites.id,
      status:      invites.status,
      createdAt:   invites.createdAt,
      roomId:      invites.roomId,
      roomName:    rooms.name,
      roomCategory: rooms.category,
      roomStatus:  rooms.status,
      inviterName: users.username,
    })
    .from(invites)
    .leftJoin(rooms, eq(invites.roomId, rooms.id))
    .leftJoin(users, eq(invites.inviterId, users.id))
    .where(and(
      eq(invites.inviteeId, session.id),
      eq(invites.status, "pending")
    ))
    .orderBy(desc(invites.createdAt))
    .limit(20);

  return NextResponse.json({ invites: pendingInvites });
}
