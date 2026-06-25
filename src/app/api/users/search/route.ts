export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { and, ilike, ne } from "drizzle-orm";
import { getSession, unauthorized } from "@/lib/getSession";
import { ONLINE_WINDOW_MS } from "@/lib/presence";

function sanitizeSearchTerm(value: string): string {
  return value.replace(/[%_\\]/g, "").trim();
}

export async function GET(req: Request) {
  const session = await getSession(req);
  if (!session) return unauthorized();

  const { searchParams } = new URL(req.url);
  const raw = sanitizeSearchTerm(searchParams.get("q") ?? "");

  if (raw.length < 2) {
    return NextResponse.json({ users: [] });
  }

  if (raw.length > 32) {
    return NextResponse.json({ error: "Search query too long" }, { status: 400 });
  }

  const pattern = `%${raw}%`;
  const onlineCutoff = new Date(Date.now() - ONLINE_WINDOW_MS);

  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      rank: users.rank,
      avatarUrl: users.avatarUrl,
      lastSeenAt: users.lastSeenAt,
    })
    .from(users)
    .where(and(ilike(users.username, pattern), ne(users.id, session.id)))
    .limit(12);

  const usersPayload = rows.map((u) => ({
    id: u.id,
    username: u.username,
    rank: u.rank.toUpperCase(),
    avatarUrl: u.avatarUrl,
    initials: u.username.slice(0, 2).toUpperCase(),
    isOnline: Boolean(u.lastSeenAt && u.lastSeenAt >= onlineCutoff),
    lastSeenAt: u.lastSeenAt?.toISOString() ?? null,
  }));

  usersPayload.sort((a, b) => {
    if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
    return a.username.localeCompare(b.username);
  });

  return NextResponse.json({ users: usersPayload });
}
