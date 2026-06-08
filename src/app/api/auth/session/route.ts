export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";

const SESSION_MS = 60 * 60 * 24 * 14 * 1000; // 14 days

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();
    const decoded = await adminAuth.verifyIdToken(idToken);

    // Sync user to Neon on first sign-in
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, decoded.uid))
      .limit(1);

    if (existing.length === 0) {
      const rawUsername =
        decoded.name?.replace(/\s+/g, "_").toLowerCase() ??
        decoded.email?.split("@")[0] ??
        decoded.uid.slice(0, 16);

      await db.insert(users).values({
        id: decoded.uid,
        email: decoded.email ?? null,
        username: rawUsername,
        avatarUrl: decoded.picture ?? null,
        coinsBalance: 100, // welcome bonus per PRD
        xp: 0,
        rank: "recruit",
        roomsCreatedCount: 0,
      });
    }

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_MS,
    });

    const res = NextResponse.json({ ok: true });
    res.cookies.set("__session", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MS / 1000,
      path: "/",
    });
    return res;
  } catch (err) {
    console.error("[session/POST]", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("__session", "", { maxAge: 0, path: "/" });
  return res;
}
