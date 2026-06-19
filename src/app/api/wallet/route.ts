export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { coinTransactions, users } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { getSession, unauthorized } from "@/lib/getSession";

export async function GET(req: Request) {
  const session = await getSession(req);
  if (!session) return unauthorized();

  const transactions = await db
    .select()
    .from(coinTransactions)
    .where(eq(coinTransactions.userId, session.id))
    .orderBy(desc(coinTransactions.createdAt))
    .limit(50);

  return NextResponse.json({
    balance: session.coinsBalance,
    transactions,
  });
}
