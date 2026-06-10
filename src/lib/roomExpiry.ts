import { db } from "@/lib/db";
import { rooms } from "@/lib/schema";
import { eq } from "drizzle-orm";

/** Lobby rooms die after 30 minutes — the invite link then 404s. */
export const LOBBY_TTL_MS = 30 * 60 * 1000;

/**
 * If the room is still in lobby and older than the TTL, mark it cancelled
 * and report true so the caller can return a 404.
 */
export async function expireLobbyIfStale(room: {
  id: string;
  status: string;
  createdAt: Date | string | null;
}): Promise<boolean> {
  if (room.status !== "lobby" || !room.createdAt) return false;
  const age = Date.now() - new Date(room.createdAt).getTime();
  if (age < LOBBY_TTL_MS) return false;

  await db
    .update(rooms)
    .set({ status: "cancelled", endedAt: new Date() })
    .where(eq(rooms.id, room.id));
  return true;
}
