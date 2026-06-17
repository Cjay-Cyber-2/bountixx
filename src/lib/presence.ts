import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { and, desc, eq, gte, ne } from "drizzle-orm";

/** Users seen within this window count as online. */
export const ONLINE_WINDOW_MS = 2 * 60 * 1000;

export async function touchPresence(userId: string): Promise<void> {
  await db
    .update(users)
    .set({ lastSeenAt: new Date() })
    .where(eq(users.id, userId));
}

export async function listOnlineUsers(excludeUserId: string) {
  const cutoff = new Date(Date.now() - ONLINE_WINDOW_MS);

  return db
    .select({
      id: users.id,
      username: users.username,
      rank: users.rank,
      avatarUrl: users.avatarUrl,
      lastSeenAt: users.lastSeenAt,
    })
    .from(users)
    .where(
      and(gte(users.lastSeenAt, cutoff), ne(users.id, excludeUserId)),
    )
    .orderBy(desc(users.lastSeenAt))
    .limit(50);
}
