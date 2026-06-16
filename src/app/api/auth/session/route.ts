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

    // Verify the Firebase ID token — this is the critical auth check
    const decoded = await adminAuth.verifyIdToken(idToken);

    // Sync user to Neon — non-fatal: a DB outage should never block login
    try {
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

        // Add uid suffix to prevent username collisions between users with the same name
        const username = `${rawUsername}_${decoded.uid.slice(0, 5)}`;

        await db.insert(users).values({
          id: decoded.uid,
          email: decoded.email ?? null,
          username,
          avatarUrl: decoded.picture ?? null,
          coinsBalance: 500,
          xp: 0,
          rank: "recruit",
          roomsCreatedCount: 0,
        });
      }
    } catch (dbErr) {
      // DB sync failed (table missing, connection error, etc.)
      // Auth is still valid — log and continue so the cookie is set
      console.error("[session/POST] DB sync failed (non-fatal):", dbErr);
    }

    // Try to mint a long-lived Firebase session cookie. This requires the
    // service account to have the "Service Account Token Creator" role
    // (iam.serviceAccounts.signBlob). On many deployments that role is missing,
    // which historically caused createSessionCookie to throw and bounced users
    // straight back to the login page after a successful Google sign-in.
    //
    // To be resilient we fall back to storing the (already verified) ID token
    // itself as the cookie value. getSession() knows how to verify either form.
    let cookieValue = idToken;
    let maxAgeSeconds = 60 * 60; // ID tokens are valid for 1 hour
    try {
      cookieValue = await adminAuth.createSessionCookie(idToken, {
        expiresIn: SESSION_MS,
      });
      maxAgeSeconds = SESSION_MS / 1000;
    } catch (cookieErr) {
      console.error(
        "[session/POST] createSessionCookie failed, falling back to ID-token cookie:",
        cookieErr
      );
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set("__session", cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: maxAgeSeconds,
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
