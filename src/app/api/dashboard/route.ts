export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rooms, submissions, roomPlayers, users, invites } from "@/lib/schema";
import { eq, and, desc, count, inArray, ne } from "drizzle-orm";
import { getSession, unauthorized } from "@/lib/getSession";
import { isUnlimitedCoinsEmail } from "@/lib/coins";
import { listOnlineUsers, serializeOnlineUsers } from "@/lib/presence";
import { timeAgo } from "@/lib/utils";
import { expireStalePendingInvites, inviteMinutesLeft, isInviteExpired } from "@/lib/inviteExpiry";
import { expireLobbyIfStale } from "@/lib/roomExpiry";

const CATEGORY_COLORS: Record<string, string> = {
  coding: "#FF6B1A", trivia: "#9B6BFF", logic: "#00D68F", math: "#F0A500",
};

export async function GET(req: Request) {
  try {
    const session = await getSession(req);
    if (!session) return unauthorized();

    const uid = session.id;

  // Rooms won (submissions where this user is winner)
  const [wonResult] = await db
    .select({ count: count() })
    .from(submissions)
    .where(and(eq(submissions.userId, uid), eq(submissions.isWinner, true)));

  // Rooms participated (distinct rooms)
  const [playedResult] = await db
    .select({ count: count() })
    .from(roomPlayers)
    .where(eq(roomPlayers.userId, uid));

  const roomsWon   = wonResult?.count ?? 0;
  const roomsPlayed = playedResult?.count ?? 0;
  const winRate    = roomsPlayed > 0 ? Math.round((roomsWon / roomsPlayed) * 100) : 0;

  // Recent rooms the user participated in (last 10)
  const recentRoomRows = await db
    .select({
      roomId:   roomPlayers.roomId,
      joinedAt: roomPlayers.joinedAt,
      status:   roomPlayers.status,
    })
    .from(roomPlayers)
    .where(eq(roomPlayers.userId, uid))
    .orderBy(desc(roomPlayers.joinedAt))
    .limit(10);

  const recentRoomIds = recentRoomRows.map((r) => r.roomId);

  let recentRooms: { name: string; category: string; place: string; coins: number; date: string }[] = [];

  if (recentRoomIds.length > 0) {
    const roomDetails = await db
      .select({
        id:        rooms.id,
        name:      rooms.name,
        category:  rooms.category,
        status:    rooms.status,
        endedAt:   rooms.endedAt,
        prizePool: rooms.prizePool,
      })
      .from(rooms)
      .where(inArray(rooms.id, recentRoomIds));

    const submissionsForRooms = await db
      .select({
        roomId:   submissions.roomId,
        isWinner: submissions.isWinner,
        testsPassed: submissions.testsPassed,
        testsTotal:  submissions.testsTotal,
      })
      .from(submissions)
      .where(and(
        eq(submissions.userId, uid),
        inArray(submissions.roomId, recentRoomIds)
      ));

    const submissionsMap = new Map(submissionsForRooms.map((s) => [s.roomId, s]));

    recentRooms = roomDetails.map((room) => {
      const sub = submissionsMap.get(room.id);
      const place = sub?.isWinner ? "1st" : "—";
      const coins = sub?.isWinner ? (room.prizePool ?? 0) : 0;
      const joinedAt = recentRoomRows.find((r) => r.roomId === room.id)?.joinedAt;

      return {
        roomId:   room.id,
        name:     room.name,
        category: room.category ?? "coding",
        place,
        coins,
        date: joinedAt ? timeAgo(new Date(joinedAt)) : "",
      };
    });
  }

  const onlineUsers = await listOnlineUsers(uid);

  const [activeLobby] = await db
    .select({ id: rooms.id, name: rooms.name, createdAt: rooms.createdAt, adminId: rooms.adminId, status: rooms.status })
    .from(rooms)
    .where(and(eq(rooms.adminId, uid), eq(rooms.status, "lobby")))
    .orderBy(desc(rooms.createdAt))
    .limit(1);

  let activeLobbyLive: { id: string; name: string } | null = null;
  if (activeLobby) {
    const lobbyExpired = await expireLobbyIfStale(activeLobby);
    if (!lobbyExpired) {
      activeLobbyLive = { id: activeLobby.id, name: activeLobby.name };
    }
  }

  const [joinedLobbyRow] = await db
    .select({ id: rooms.id, name: rooms.name, createdAt: rooms.createdAt, adminId: rooms.adminId, status: rooms.status })
    .from(roomPlayers)
    .innerJoin(rooms, eq(roomPlayers.roomId, rooms.id))
    .where(and(eq(roomPlayers.userId, uid), eq(rooms.status, "lobby"), ne(rooms.adminId, uid)))
    .orderBy(desc(roomPlayers.joinedAt))
    .limit(1);

  let joinedLobbyLive: { id: string; name: string } | null = null;
  if (joinedLobbyRow) {
    const lobbyExpired = await expireLobbyIfStale(joinedLobbyRow);
    if (!lobbyExpired) {
      joinedLobbyLive = { id: joinedLobbyRow.id, name: joinedLobbyRow.name };
    }
  }

  await expireStalePendingInvites(uid);

  const pendingInviteRows = await db
    .select({
      id: invites.id,
      roomId: invites.roomId,
      roomName: rooms.name,
      roomStatus: rooms.status,
      roomCreatedAt: rooms.createdAt,
      roomAdminId: rooms.adminId,
      inviterName: users.username,
      createdAt: invites.createdAt,
    })
    .from(invites)
    .leftJoin(rooms, eq(invites.roomId, rooms.id))
    .leftJoin(users, eq(invites.inviterId, users.id))
    .where(and(eq(invites.inviteeId, uid), eq(invites.status, "pending")))
    .orderBy(desc(invites.createdAt))
    .limit(10);

  const pendingInvites = [];
  for (const inv of pendingInviteRows) {
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
    pendingInvites.push({
      id: inv.id,
      roomId: inv.roomId,
      roomName: inv.roomName,
      inviterName: inv.inviterName ?? "Someone",
      minutesLeft: inviteMinutesLeft(inv.createdAt),
    });
  }

  return NextResponse.json({
    roomsCreated: session.roomsCreatedCount,
    roomsWon,
    roomsPlayed,
    winRate,
    totalXp: session.xp,
    coinsBalance: session.coinsBalance ?? 0,
    coinsUnlimited: isUnlimitedCoinsEmail(session.email),
    recentRooms,
    onlineUsers: serializeOnlineUsers(onlineUsers),
    activeLobby: activeLobbyLive,
    joinedLobby: joinedLobbyLive,
    pendingInvites,
  });
  } catch (err) {
    console.error("[dashboard] GET failed:", err);
    return NextResponse.json(
      { error: "Dashboard failed to load. Please refresh in a moment." },
      { status: 503 },
    );
  }
}
