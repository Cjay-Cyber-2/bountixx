export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, coinTransactions } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
import { getSession, unauthorized } from "@/lib/getSession";
import { randomUUID } from "crypto";

type BundleId = "starter" | "challenger" | "elite" | "champion" | "legendary";

const BUNDLES: Record<BundleId, { coins: number; amountKobo: number }> = {
  starter:    { coins: 100,  amountKobo: 75000   },
  challenger: { coins: 300,  amountKobo: 200000  },
  elite:      { coins: 750,  amountKobo: 400000  },
  champion:   { coins: 2000, amountKobo: 950000  },
  legendary:  { coins: 5500, amountKobo: 2500000 },
};

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return unauthorized();

  const body = await request.json() as { reference?: string };
  if (!body.reference) {
    return NextResponse.json({ error: "Reference is required" }, { status: 400 });
  }

  const { reference } = body;

  // Verify with Paystack
  const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Verification failed" }, { status: 502 });
  }

  const data = await res.json() as {
    data: {
      status: string;
      metadata: { userId: string; bundleId: string; coins: number };
    };
  };

  if (data.data.status !== "success") {
    return NextResponse.json({ error: "Payment not successful" }, { status: 400 });
  }

  // Prevent replay attacks — check userId matches
  if (data.data.metadata.userId !== session.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const dbReference = `paystack:${reference}`;

  // Check if already processed
  const existing = await db
    .select({ id: coinTransactions.id })
    .from(coinTransactions)
    .where(eq(coinTransactions.reference, dbReference))
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json({ error: "Already processed" }, { status: 409 });
  }

  const bundleId = data.data.metadata.bundleId as BundleId;
  const bundle = BUNDLES[bundleId];
  if (!bundle) {
    return NextResponse.json({ error: "Invalid bundle" }, { status: 400 });
  }

  const coins = bundle.coins;

  // Credit coins
  const [updated] = await db
    .update(users)
    .set({ coinsBalance: sql`${users.coinsBalance} + ${coins}` })
    .where(eq(users.id, session.id))
    .returning({ coinsBalance: users.coinsBalance });

  // Record transaction
  await db.insert(coinTransactions).values({
    id: randomUUID(),
    userId: session.id,
    amount: coins,
    type: "purchased",
    reference: dbReference,
  });

  return NextResponse.json({
    ok: true,
    coinsAdded: coins,
    newBalance: updated?.coinsBalance ?? 0,
  });
}
