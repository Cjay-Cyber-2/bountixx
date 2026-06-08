export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getSession, unauthorized } from "@/lib/getSession";

type BundleId = "starter" | "challenger" | "elite" | "champion" | "legendary";

const BUNDLES: Record<BundleId, { coins: number; amountCents: number; label: string }> = {
  starter:    { coins: 100,  amountCents: 99,   label: "Starter"    },
  challenger: { coins: 300,  amountCents: 249,  label: "Challenger" },
  elite:      { coins: 750,  amountCents: 499,  label: "Elite"      },
  champion:   { coins: 2000, amountCents: 1199, label: "Champion"   },
  legendary:  { coins: 5500, amountCents: 2799, label: "Legendary"  },
};

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return unauthorized();

  const body = await request.json() as { bundleId?: string };
  const bundleId = body.bundleId as BundleId;

  if (!bundleId || !(bundleId in BUNDLES)) {
    return NextResponse.json({ error: "Invalid bundleId" }, { status: 400 });
  }

  const bundle = BUNDLES[bundleId];
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  const checkoutSession = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${bundle.coins} Bountixx Coins`,
            description: `${bundle.label} Bundle`,
          },
          unit_amount: bundle.amountCents,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/wallet`,
    metadata: {
      userId: session.id,
      bundleId,
      coins: bundle.coins.toString(),
    },
    customer_email: session.email ?? undefined,
  });

  return NextResponse.json({
    sessionId: checkoutSession.id,
    url: checkoutSession.url,
  });
}
