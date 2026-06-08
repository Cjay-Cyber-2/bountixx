export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession, unauthorized } from "@/lib/getSession";

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

  const body = await request.json() as { bundleId?: string };
  const bundleId = body.bundleId as BundleId;

  if (!bundleId || !(bundleId in BUNDLES)) {
    return NextResponse.json({ error: "Invalid bundleId" }, { status: 400 });
  }

  const bundle = BUNDLES[bundleId];

  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: session.email,
      amount: bundle.amountKobo,
      currency: "NGN",
      metadata: {
        userId: session.id,
        bundleId,
        coins: bundle.coins,
      },
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[Paystack] initialize failed:", err);
    return NextResponse.json({ error: "Payment initialization failed" }, { status: 502 });
  }

  const data = await res.json() as {
    data: { authorization_url: string; reference: string };
  };

  return NextResponse.json({
    authorizationUrl: data.data.authorization_url,
    reference: data.data.reference,
  });
}
