export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rooms, testCases } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { getSession, unauthorized } from "@/lib/getSession";
import { randomUUID } from "crypto";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return unauthorized();

  const { id: roomId } = await params;

  const [room] = await db
    .select({ adminId: rooms.adminId })
    .from(rooms)
    .where(eq(rooms.id, roomId))
    .limit(1);

  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  if (room.adminId !== session.id) {
    return NextResponse.json({ error: "Only the admin can add test cases" }, { status: 403 });
  }

  const { tests } = await req.json() as {
    tests: { input: string; expectedOutput: string; isHidden: boolean }[];
  };

  if (!Array.isArray(tests) || tests.length === 0) {
    return NextResponse.json({ error: "tests array required" }, { status: 400 });
  }

  const inserted = await db
    .insert(testCases)
    .values(
      tests.map((t) => ({
        id:             randomUUID(),
        roomId,
        input:          t.input,
        expectedOutput: t.expectedOutput,
        isHidden:       t.isHidden ?? false,
        isActive:       true,
      }))
    )
    .returning();

  return NextResponse.json({ testCases: inserted }, { status: 201 });
}
