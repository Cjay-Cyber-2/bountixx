export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { users, coinTransactions } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY ?? "");
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const sig = request.headers.get("stripe-signature");
  const rawBody = await request.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("[Stripe Webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { userId, bundleId: _bundleId, coins: coinsStr } = session.metadata ?? {};

    if (!userId || !coinsStr) {
      console.error("[Stripe Webhook] missing metadata:", session.metadata);
      return NextResponse.json({ received: true });
    }

    const coins = parseInt(coinsStr, 10);
    const dbReference = `stripe:${session.id}`;

    // Prevent replay
    const existing = await db
      .select({ id: coinTransactions.id })
      .from(coinTransactions)
      .where(eq(coinTransactions.reference, dbReference))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ received: true });
    }

    // Credit coins
    await db
      .update(users)
      .set({ coinsBalance: sql`${users.coinsBalance} + ${coins}` })
      .where(eq(users.id, userId));

    // Record transaction
    await db.insert(coinTransactions).values({
      id: randomUUID(),
      userId,
      amount: coins,
      type: "purchased",
      reference: dbReference,
    });
  }

  return NextResponse.json({ received: true });
}
