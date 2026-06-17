export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rooms, submissions, roomPlayers, users, invites } from "@/lib/schema";
import { eq, and, desc, sql, count, gte, inArray } from "drizzle-orm";
import { getSession, unauthorized } from "@/lib/getSession";
import { timeAgo } from "@/lib/utils";

const CATEGORY_COLORS: Record<string, string> = {
  coding: "#FF6B1A", trivia: "#9B6BFF", logic: "#00D68F", math: "#F0A500",
};

export async function GET(req: Request) {
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
        name:     room.name,
        category: room.category ?? "coding",
        place,
        coins,
        date: joinedAt ? timeAgo(new Date(joinedAt)) : "",
      };
    });
  }

  // Online users (last seen within 5 minutes)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const onlineUsers = await db
    .select({
      id:        users.id,
      username:  users.username,
      rank:      users.rank,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(and(
      gte(users.lastSeenAt, fiveMinutesAgo),
      sql`${users.id} != ${uid}`
    ))
    .limit(10);

  const [activeLobby] = await db
    .select({ id: rooms.id, name: rooms.name })
    .from(rooms)
    .where(and(eq(rooms.adminId, uid), eq(rooms.status, "lobby")))
    .orderBy(desc(rooms.createdAt))
    .limit(1);

  const pendingInvites = await db
    .select({
      id: invites.id,
      roomId: invites.roomId,
      roomName: rooms.name,
      inviterName: users.username,
    })
    .from(invites)
    .leftJoin(rooms, eq(invites.roomId, rooms.id))
    .leftJoin(users, eq(invites.inviterId, users.id))
    .where(and(eq(invites.inviteeId, uid), eq(invites.status, "pending")))
    .orderBy(desc(invites.createdAt))
    .limit(5);

  return NextResponse.json({
    roomsCreated: session.roomsCreatedCount,
    roomsWon,
    roomsPlayed,
    winRate,
    totalXp: session.xp,
    coinsBalance: session.coinsBalance,
    recentRooms,
    onlineUsers: onlineUsers.map((u) => ({
      id: u.id,
      username: u.username,
      rank: u.rank.toUpperCase(),
      avatarUrl: u.avatarUrl,
      initials: u.username.slice(0, 2).toUpperCase(),
    })),
    activeLobby: activeLobby ?? null,
    pendingInvites: pendingInvites
      .filter((inv) => inv.roomId && inv.roomName)
      .map((inv) => ({
        id: inv.id,
        roomId: inv.roomId,
        roomName: inv.roomName!,
        inviterName: inv.inviterName ?? "Someone",
      })),
  });
}
