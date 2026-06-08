export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { achievements } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession, unauthorized } from "@/lib/getSession";

export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();

  const rows = await db
    .select()
    .from(achievements)
    .where(eq(achievements.userId, session.id));

  return NextResponse.json({ achievements: rows });
}
