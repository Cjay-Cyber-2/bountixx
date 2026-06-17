export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { clerkAuthHealth } from "@/lib/requireAuth";
import { getDatabaseUrl, pingDatabase } from "@/lib/db";
import { activeAiProvider } from "@/lib/aiAnalyse";

export async function GET(req: Request) {
  const clerkSecret = Boolean(process.env.CLERK_SECRET_KEY?.trim());
  const clerkPublishable = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim());
  const databaseUrl = Boolean(getDatabaseUrl());
  const groq = Boolean(process.env.GROQ_API_KEY?.trim());
  const gemini = Boolean(process.env.GEMINI_API_KEY?.trim());

  const clerkProbe = await clerkAuthHealth(req);
  const dbProbe = await pingDatabase();

  const ok =
    clerkSecret &&
    clerkPublishable &&
    !clerkProbe &&
    databaseUrl &&
    dbProbe.ok &&
    (groq || gemini);

  return NextResponse.json(
    {
      ok,
      clerk: {
        publishableKey: clerkPublishable,
        secretKey: clerkSecret,
        serverAuth: clerkProbe ? "failed" : "ok",
      },
      database: {
        configured: databaseUrl,
        reachable: dbProbe.ok,
        error: dbProbe.ok ? null : dbProbe.error,
      },
      ai: {
        provider: activeAiProvider(),
        groq: groq,
        gemini: gemini,
      },
    },
    { status: ok ? 200 : 503 }
  );
}
