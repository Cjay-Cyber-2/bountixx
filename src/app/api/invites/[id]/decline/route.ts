export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invites, rooms } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import { getSession, unauthorized } from "@/lib/getSession";
import { expireLobbyIfStale } from "@/lib/roomExpiry";
import { expireStalePendingInvites, isInviteExpired } from "@/lib/inviteExpiry";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession(req);
  if (!session) return unauthorized();

  const { id } = await params;

  await expireStalePendingInvites(session.id);

  const [invite] = await db
    .select({
      id: invites.id,
      inviteeId: invites.inviteeId,
      status: invites.status,
      createdAt: invites.createdAt,
      roomId: invites.roomId,
      roomStatus: rooms.status,
      roomCreatedAt: rooms.createdAt,
      roomAdminId: rooms.adminId,
    })
    .from(invites)
    .leftJoin(rooms, eq(invites.roomId, rooms.id))
    .where(eq(invites.id, id))
    .limit(1);

  if (!invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  if (invite.inviteeId !== session.id) {
    return NextResponse.json({ error: "Not your invite" }, { status: 403 });
  }

  if (invite.status !== "pending") {
    return NextResponse.json({ error: "Invite is no longer active" }, { status: 409 });
  }

  if (isInviteExpired(invite.createdAt)) {
    await db.update(invites).set({ status: "declined" }).where(eq(invites.id, id));
    return NextResponse.json({ error: "This invite has expired" }, { status: 410 });
  }

  if (
    invite.roomId &&
    invite.roomStatus === "lobby" &&
    invite.roomCreatedAt &&
    invite.roomAdminId
  ) {
    if (
      await expireLobbyIfStale({
        id: invite.roomId,
        status: invite.roomStatus,
        adminId: invite.roomAdminId,
        createdAt: invite.roomCreatedAt,
      })
    ) {
      return NextResponse.json({ error: "This arena has expired" }, { status: 410 });
    }
  }

  if (invite.roomStatus && invite.roomStatus !== "lobby") {
    return NextResponse.json({ error: "This arena is no longer open" }, { status: 409 });
  }

  await db.update(invites).set({ status: "declined" }).where(eq(invites.id, id));

  return NextResponse.json({ ok: true });
}
