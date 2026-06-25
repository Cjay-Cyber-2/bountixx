import { db } from "@/lib/db";
import { rooms, roomPlayers } from "@/lib/schema";
import { and, count, eq, ne } from "drizzle-orm";
import { LOBBY_TTL_MINUTES } from "@/lib/lobbyTtl";

/** Lobby rooms and direct invites expire after 15 minutes. */
export const LOBBY_TTL_MS = LOBBY_TTL_MINUTES * 60 * 1000;
export const INVITE_TTL_MS = LOBBY_TTL_MS;

/**
 * If the room is still in lobby, older than the TTL, and no guest has joined,
 * mark it cancelled and report true so the caller can return a 404.
 */
export async function expireLobbyIfStale(room: {
  id: string;
  status: string;
  adminId: string;
  createdAt: Date | string | null;
}): Promise<boolean> {
  if (room.status !== "lobby" || !room.createdAt) return false;
  const age = Date.now() - new Date(room.createdAt).getTime();
  if (age < LOBBY_TTL_MS) return false;

  const [{ guestCount }] = await db
    .select({ guestCount: count() })
    .from(roomPlayers)
    .where(
      and(
        eq(roomPlayers.roomId, room.id),
        ne(roomPlayers.userId, room.adminId),
      ),
    );

  if ((guestCount ?? 0) > 0) return false;

  await db
    .update(rooms)
    .set({ status: "cancelled", endedAt: new Date() })
    .where(eq(rooms.id, room.id));
  return true;
}
