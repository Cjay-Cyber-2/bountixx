import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { and, desc, eq, gte, isNull, lt, ne, or } from "drizzle-orm";

/** Users seen within this window count as online (tolerates background-tab timer throttling). */
export const ONLINE_WINDOW_MS = 120 * 1000;

const PRESENCE_WRITE_INTERVAL_MS = 15_000;

/** Mark a user as online. Throttled unless force=true (heartbeat / presence poll). */
export async function touchPresence(userId: string, force = false): Promise<void> {
  if (force) {
    await db
      .update(users)
      .set({ lastSeenAt: new Date() })
      .where(eq(users.id, userId));
    return;
  }

  const staleBefore = new Date(Date.now() - PRESENCE_WRITE_INTERVAL_MS);
  await db
    .update(users)
    .set({ lastSeenAt: new Date() })
    .where(
      and(
        eq(users.id, userId),
        or(isNull(users.lastSeenAt), lt(users.lastSeenAt, staleBefore)),
      ),
    );
}

export async function listOnlineUsers(excludeUserId?: string) {
  const cutoff = new Date(Date.now() - ONLINE_WINDOW_MS);

  const conditions = [gte(users.lastSeenAt, cutoff)];
  if (excludeUserId) {
    conditions.push(ne(users.id, excludeUserId));
  }

  return db
    .select({
      id: users.id,
      username: users.username,
      rank: users.rank,
      avatarUrl: users.avatarUrl,
      lastSeenAt: users.lastSeenAt,
    })
    .from(users)
    .where(and(...conditions))
    .orderBy(desc(users.lastSeenAt))
    .limit(100);
}

export async function countOnlineUsers(): Promise<number> {
  const cutoff = new Date(Date.now() - ONLINE_WINDOW_MS);
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(gte(users.lastSeenAt, cutoff));
  return rows.length;
}

export type OnlineUserPayload = {
  id: string;
  username: string;
  rank: string;
  avatarUrl: string | null;
  lastSeenAt: string | null;
  initials: string;
};

export function serializeOnlineUsers(
  rows: Awaited<ReturnType<typeof listOnlineUsers>>,
): OnlineUserPayload[] {
  return rows.map((u) => ({
    id: u.id,
    username: u.username,
    rank: u.rank.toUpperCase(),
    avatarUrl: u.avatarUrl,
    lastSeenAt: u.lastSeenAt?.toISOString() ?? null,
    initials: u.username.slice(0, 2).toUpperCase(),
  }));
}
