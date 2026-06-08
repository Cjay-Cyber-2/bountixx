export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { and, gte, ne, sql } from "drizzle-orm";
import { getSession, unauthorized } from "@/lib/getSession";

export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();

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
      sql`${users.id} != ${session.id}`
    ))
    .limit(20);

  return NextResponse.json({
    users: onlineUsers.map((u) => ({
      id:       u.id,
      username: u.username,
      rank:     u.rank.toUpperCase(),
      avatarUrl: u.avatarUrl,
      initials: u.username.slice(0, 2).toUpperCase(),
    })),
  });
}
