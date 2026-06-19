export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession, unauthorized } from "@/lib/getSession";
import { listOnlineUsers, touchPresence } from "@/lib/presence";

export async function GET(req: Request) {
  const session = await getSession(req);
  if (!session) return unauthorized();

  await touchPresence(session.id, true);

  const onlineUsers = await listOnlineUsers(session.id);

  return NextResponse.json({
    count: onlineUsers.length,
    users: onlineUsers.map((u) => ({
      id: u.id,
      username: u.username,
      rank: u.rank.toUpperCase(),
      avatarUrl: u.avatarUrl,
      lastSeenAt: u.lastSeenAt?.toISOString() ?? null,
      initials: u.username.slice(0, 2).toUpperCase(),
    })),
  });
}

export async function POST(req: Request) {
  const session = await getSession(req);
  if (!session) return unauthorized();

  await touchPresence(session.id, true);

  return NextResponse.json({ ok: true });
}
