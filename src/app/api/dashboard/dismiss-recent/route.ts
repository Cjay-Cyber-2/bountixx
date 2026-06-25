export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dismissedRecentRooms, roomPlayers } from "@/lib/schema";
import { eq, and, inArray, desc } from "drizzle-orm";
import { getSession, unauthorized } from "@/lib/getSession";
import { ensureDatabaseSchema } from "@/lib/ensureSchema";

export async function POST(req: Request) {
  const session = await getSession(req);
  if (!session) return unauthorized();

  try {
    await ensureDatabaseSchema();
  } catch (err) {
    console.error("[POST /api/dashboard/dismiss-recent] schema:", err);
  }

  const body = (await req.json().catch(() => ({}))) as {
    roomId?: string;
    clearAll?: boolean;
  };

  if (body.clearAll) {
    const recent = await db
      .select({ roomId: roomPlayers.roomId })
      .from(roomPlayers)
      .where(eq(roomPlayers.userId, session.id))
      .orderBy(desc(roomPlayers.joinedAt))
      .limit(10);

    const roomIds = recent.map((r) => r.roomId);
    if (roomIds.length === 0) {
      return NextResponse.json({ ok: true, dismissed: 0 });
    }

    const existing = await db
      .select({ roomId: dismissedRecentRooms.roomId })
      .from(dismissedRecentRooms)
      .where(
        and(
          eq(dismissedRecentRooms.userId, session.id),
          inArray(dismissedRecentRooms.roomId, roomIds),
        ),
      );

    const existingSet = new Set(existing.map((r) => r.roomId));
    const toInsert = roomIds.filter((id) => !existingSet.has(id));

    if (toInsert.length > 0) {
      await db.insert(dismissedRecentRooms).values(
        toInsert.map((roomId) => ({
          userId: session.id,
          roomId,
        })),
      );
    }

    return NextResponse.json({ ok: true, dismissed: toInsert.length });
  }

  if (!body.roomId?.trim()) {
    return NextResponse.json({ error: "roomId is required" }, { status: 400 });
  }

  const roomId = body.roomId.trim();

  const [existing] = await db
    .select({ roomId: dismissedRecentRooms.roomId })
    .from(dismissedRecentRooms)
    .where(and(eq(dismissedRecentRooms.userId, session.id), eq(dismissedRecentRooms.roomId, roomId)))
    .limit(1);

  if (!existing) {
    await db.insert(dismissedRecentRooms).values({
      userId: session.id,
      roomId,
    });
  }

  return NextResponse.json({ ok: true, roomId });
}
