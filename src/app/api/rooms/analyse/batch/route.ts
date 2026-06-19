export const dynamic = "force-dynamic";
export const maxDuration = 120;

import { NextResponse } from "next/server";
import { requireClerkAuth } from "@/lib/requireAuth";
import {
  AiConfigError,
  AiParseError,
  AiProviderError,
  analyseChallenge,
  type AnalysisResult,
} from "@/lib/aiAnalyse";

const BATCH_DELAY_MS = 2500;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function isRateLimitError(message: string): boolean {
  return /rate limit/i.test(message) || /tokens per minute/i.test(message);
}

export async function POST(req: Request) {
  const authResult = await requireClerkAuth(req);
  if (!authResult.ok) return authResult.response;

  let body: {
    tasks?: { id: string; taskRaw: string; languageHint?: string }[];
    arenaName?: string;
  };

  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const tasks = body.tasks?.filter((t) => t.taskRaw?.trim()) ?? [];
  if (tasks.length === 0) {
    return NextResponse.json({ error: "At least one task is required" }, { status: 400 });
  }

  const results: Record<string, AnalysisResult | { error: string }> = {};

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    if (i > 0) await sleep(BATCH_DELAY_MS);

    const userMessage = [
      body.arenaName ? `Arena: "${body.arenaName}"` : null,
      task.languageHint
        ? `The host has chosen this programming language: "${task.languageHint}". Do NOT ask for clarification about the language.`
        : null,
      `Challenge:\n${task.taskRaw}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    try {
      results[task.id] = await analyseChallenge(userMessage, task.languageHint);
    } catch (err) {
      const message =
        err instanceof AiProviderError
          ? err.message
          : err instanceof AiConfigError
            ? err.message
            : err instanceof AiParseError
              ? err.message
              : "AI service unreachable";

      if (isRateLimitError(message) && i < tasks.length - 1) {
        await sleep(8000);
        try {
          results[task.id] = await analyseChallenge(userMessage, task.languageHint);
          continue;
        } catch (retryErr) {
          results[task.id] = {
            error: retryErr instanceof Error ? retryErr.message : message,
          };
          continue;
        }
      }

      results[task.id] = { error: message };
    }
  }

  return NextResponse.json({ results });
}
