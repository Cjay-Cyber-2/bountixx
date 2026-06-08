export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pushTokens } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession, unauthorized } from "@/lib/getSession";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return unauthorized();

  const body = await request.json() as { token?: string };
  if (!body.token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  const { token } = body;

  // Check if token already exists
  const existing = await db
    .select({ id: pushTokens.id })
    .from(pushTokens)
    .where(eq(pushTokens.token, token))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(pushTokens).values({
      id: randomUUID(),
      userId: session.id,
      token,
    });
  }

  return NextResponse.json({ ok: true });
}
