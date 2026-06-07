import { headers } from "next/headers";
import { Webhook } from "svix";
import { db } from "@/lib/db";
import { users, wallets } from "@/lib/schema";

type ClerkUserEvent = {
  type: string;
  data: {
    id: string;
    username: string | null;
    email_addresses: { email_address: string }[];
    phone_numbers: { phone_number: string }[];
    image_url: string;
  };
};

export async function POST(req: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) return new Response("Webhook secret not set", { status: 500 });

  const headersList = await headers();
  const svixId = headersList.get("svix-id");
  const svixTimestamp = headersList.get("svix-timestamp");
  const svixSignature = headersList.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const payload = await req.text();
  const wh = new Webhook(webhookSecret);

  let event: ClerkUserEvent;
  try {
    event = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkUserEvent;
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "user.created") {
    const { id, username, email_addresses, phone_numbers, image_url } = event.data;
    const email = email_addresses[0]?.email_address ?? null;
    const phone = phone_numbers[0]?.phone_number ?? null;

    await db.insert(users).values({
      id,
      username: username ?? email?.split("@")[0] ?? id,
      email,
      phone,
      avatarUrl: image_url,
    });

    // Give every new user a starter wallet with 100 coins
    await db.insert(wallets).values({ id, balance: 100 });
  }

  return new Response("OK", { status: 200 });
}
