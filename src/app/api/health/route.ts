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
  const jdoodleId = Boolean(process.env.JDOODLE_CLIENT_ID?.trim());
  const jdoodleSecret = Boolean(process.env.JDOODLE_CLIENT_SECRET?.trim());
  const judge0 = Boolean(process.env.JUDGE0_URL?.trim());
  const piston = Boolean(process.env.PISTON_URL?.trim());
  const codeRunner = jdoodleId && jdoodleSecret
    ? "jdoodle"
    : judge0
      ? "judge0"
      : piston
        ? "piston"
        : "js-only";

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
      codeRunner: {
        active: codeRunner,
        jdoodle: jdoodleId && jdoodleSecret,
        jdoodleClientId: jdoodleId,
        jdoodleClientSecret: jdoodleSecret,
        judge0,
        piston,
      },
    },
    { status: ok ? 200 : 503 }
  );
}
