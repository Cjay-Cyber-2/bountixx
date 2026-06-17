export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession, unauthorized } from "@/lib/getSession";
import { touchPresence } from "@/lib/presence";
import { isUnlimitedCoinsEmail } from "@/lib/coins";

export async function GET(req: Request) {
  const session = await getSession(req);
  if (!session) return unauthorized();

  await touchPresence(session.id);

  return NextResponse.json(
    {
      user: session,
      coinsUnlimited: isUnlimitedCoinsEmail(session.email),
    },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
  );
}

export async function PUT(req: Request) {
  const session = await getSession(req);
  if (!session) return unauthorized();

  const body = await req.json() as { username?: string; avatarUrl?: string };
  const updates: Partial<typeof users.$inferInsert> = {};

  if (body.avatarUrl !== undefined) {
    updates.avatarUrl = body.avatarUrl;
  }

  if (body.username !== undefined) {
    const trimmed = body.username.trim();
    if (!trimmed || trimmed.length < 3) {
      return NextResponse.json({ error: "Username must be at least 3 characters" }, { status: 400 });
    }
    if (!/^[a-z0-9_]+$/i.test(trimmed)) {
      return NextResponse.json({ error: "Username can only contain letters, numbers, and underscores" }, { status: 400 });
    }

    // Check uniqueness
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, trimmed))
      .limit(1);

    if (existing.length > 0 && existing[0].id !== session.id) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }
    updates.username = trimmed;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ user: session });
  }

  const [updated] = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, session.id))
    .returning();

  return NextResponse.json({ user: updated });
}
