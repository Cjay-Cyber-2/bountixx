export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { clerkAuthHealth } from "@/lib/requireAuth";
import { pingDatabase, getDatabaseUrl } from "@/lib/db";
import { activeAiProvider } from "@/lib/aiAnalyse";
import { groqApiKeyCount, hasGroqApiKeys } from "@/lib/groqKeys";
import { ensureDatabaseSchema } from "@/lib/ensureSchema";

export async function GET(req: Request) {
  const clerkSecret = Boolean(process.env.CLERK_SECRET_KEY?.trim());
  const clerkPublishable = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim());
  const databaseUrl = Boolean(getDatabaseUrl());
  const groq = hasGroqApiKeys();
  const groqKeyCount = groqApiKeyCount();
  const gemini = Boolean(process.env.GEMINI_API_KEY?.trim());

  const clerkProbe = await clerkAuthHealth(req);
  const dbProbe = await pingDatabase();

  let schemaOk = false;
  let schemaError: string | null = null;
  if (databaseUrl && dbProbe.ok) {
    try {
      await ensureDatabaseSchema();
      schemaOk = true;
    } catch (err) {
      schemaError = err instanceof Error ? err.message : String(err);
    }
  }

  const ok =
    clerkSecret &&
    clerkPublishable &&
    clerkProbe.ok &&
    databaseUrl &&
    dbProbe.ok &&
    schemaOk &&
    (groq || gemini);

  return NextResponse.json(
    {
      ok,
      clerk: {
        publishableKey: clerkPublishable,
        secretKey: clerkSecret,
        serverAuth: clerkProbe.ok ? "ok" : "failed",
        error: clerkProbe.ok ? null : clerkProbe.error,
      },
      database: {
        configured: databaseUrl,
        reachable: dbProbe.ok,
        schema: schemaOk ? "ok" : "failed",
        error: dbProbe.ok ? schemaError : dbProbe.error,
      },
      ai: {
        provider: activeAiProvider(),
        groq: groq,
        groqKeyCount: groqKeyCount,
        gemini: gemini,
      },
    },
    { status: ok ? 200 : 503 }
  );
}
