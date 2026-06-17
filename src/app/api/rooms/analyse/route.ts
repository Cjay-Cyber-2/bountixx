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

  let body: { taskRaw?: string; arenaName?: string; languageHint?: string };
  try {
    body = (await req.json()) as { taskRaw?: string; arenaName?: string; languageHint?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { taskRaw, arenaName, languageHint } = body;

  if (!taskRaw?.trim()) {
    return NextResponse.json({ error: "Task text is required" }, { status: 400 });
  }

  const userMessage = [
    arenaName ? `Arena: "${arenaName}"` : null,
    languageHint
      ? `The host has chosen this programming language for the coding challenge: "${languageHint}". Treat the language as specified and do NOT ask for clarification about the language.`
      : null,
    `Challenge:\n${taskRaw}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const analysis = await analyseChallenge(userMessage, languageHint);
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
