export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession, unauthorized } from "@/lib/getSession";
import { listOnlineUsers, serializeOnlineUsers, touchPresence } from "@/lib/presence";

export async function GET(req: Request) {
  const session = await getSession(req);
  if (!session) return unauthorized();

  await touchPresence(session.id, true);

  const onlineUsers = await listOnlineUsers(session.id);
  const users = serializeOnlineUsers(onlineUsers);

  return NextResponse.json({
    count: users.length,
    users,
  });
}

export async function POST(req: Request) {
  const session = await getSession(req);
  if (!session) return unauthorized();

  await touchPresence(session.id, true);

  return NextResponse.json({ ok: true });
}
