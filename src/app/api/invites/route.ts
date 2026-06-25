export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invites, rooms, users } from "@/lib/schema";
import { eq, and, desc } from "drizzle-orm";
import { getSession, unauthorized } from "@/lib/getSession";
import { expireStalePendingInvites, inviteMinutesLeft, isInviteExpired } from "@/lib/inviteExpiry";
import { expireLobbyIfStale } from "@/lib/roomExpiry";

export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();

  await expireStalePendingInvites(session.id);

  const rows = await db
    .select({
      id: invites.id,
      status: invites.status,
      createdAt: invites.createdAt,
      roomId: invites.roomId,
      roomName: rooms.name,
      roomCategory: rooms.category,
      roomStatus: rooms.status,
      roomCreatedAt: rooms.createdAt,
      roomAdminId: rooms.adminId,
      inviterName: users.username,
    })
    .from(invites)
    .leftJoin(rooms, eq(invites.roomId, rooms.id))
    .leftJoin(users, eq(invites.inviterId, users.id))
    .where(and(
      eq(invites.inviteeId, session.id),
      eq(invites.status, "pending"),
    ))
    .orderBy(desc(invites.createdAt))
    .limit(20);

  const invitesPayload = [];
  for (const inv of rows) {
    if (!inv.roomId || !inv.roomName || inv.roomStatus !== "lobby") continue;
    if (isInviteExpired(inv.createdAt)) continue;
    if (
      inv.roomAdminId &&
      inv.roomCreatedAt &&
      (await expireLobbyIfStale({
        id: inv.roomId,
        status: inv.roomStatus,
        adminId: inv.roomAdminId,
        createdAt: inv.roomCreatedAt,
      }))
    ) {
      continue;
    }
    invitesPayload.push({
      id: inv.id,
      status: inv.status,
      createdAt: inv.createdAt,
      roomId: inv.roomId,
      roomName: inv.roomName,
      roomCategory: inv.roomCategory,
      roomStatus: inv.roomStatus,
      inviterName: inv.inviterName,
      minutesLeft: inviteMinutesLeft(inv.createdAt),
    });
  }

  return NextResponse.json({ invites: invitesPayload });
}
