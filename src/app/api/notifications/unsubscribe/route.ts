export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pushTokens } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import { getSession, unauthorized } from "@/lib/getSession";

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) return unauthorized();

  const body = await request.json() as { token?: string };
  if (!body.token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  await db
    .delete(pushTokens)
    .where(
      and(
        eq(pushTokens.token, body.token),
        eq(pushTokens.userId, session.id)
      )
    );

  return NextResponse.json({ ok: true });
}
