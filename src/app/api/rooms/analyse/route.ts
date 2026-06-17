export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { requireClerkAuth } from "@/lib/requireAuth";
import {
  AiConfigError,
  AiParseError,
  AiProviderError,
  analyseChallenge,
} from "@/lib/aiAnalyse";

export async function POST(req: Request) {
  const authResult = await requireClerkAuth(req);
  if (!authResult.ok) return authResult.response;

  let body: { taskRaw?: string; arenaName?: string };
  try {
    body = (await req.json()) as { taskRaw?: string; arenaName?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { taskRaw, arenaName } = body;

  if (!taskRaw?.trim()) {
    return NextResponse.json({ error: "Task text is required" }, { status: 400 });
  }

  const userMessage = arenaName
    ? `Arena: "${arenaName}"\n\nChallenge:\n${taskRaw}`
    : `Challenge:\n${taskRaw}`;

  try {
    const analysis = await analyseChallenge(userMessage);
    return NextResponse.json({ analysis });
  } catch (err) {
    if (err instanceof AiConfigError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    if (err instanceof AiParseError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    if (err instanceof AiProviderError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }

    console.error("[analyse] unexpected error:", err);
    return NextResponse.json({ error: "AI service unreachable" }, { status: 503 });
  }
}
