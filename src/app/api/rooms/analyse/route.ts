export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession, unauthorized } from "@/lib/getSession";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

type AnalysisResult = {
  valid: boolean;
  invalidReason?: string;
  category: "coding" | "trivia" | "logic" | "math" | "writing" | "design" | "meme";
  title: string;
  difficulty: "rookie" | "challenger" | "elite" | "legendary";
  taskNormalised: string;
  starterCode?: string;
  publicTests?: { input: string; expectedOutput: string }[];
  hiddenTests?: { input: string; expectedOutput: string }[];
  canonicalAnswer?: string;
};

const SYSTEM_PROMPT = `You are the Bountixx AI Arena Engine. Analyse the challenge submitted by a user and return a JSON object.

Rules:
- VALID = the task is real, solvable, and specific enough to have a clear correct answer or completion.
- INVALID = the task is nonsense, spam, offensive, or too vague to judge.

For CODING tasks, generate exactly 5 publicTests and 20 hiddenTests (input/expectedOutput pairs). Include edge cases (empty string, null, boundaries, negatives). Also provide a starterCode function skeleton in JavaScript.

For TRIVIA/LOGIC/MATH tasks, provide the canonicalAnswer (the single correct answer).

Return ONLY valid JSON, no markdown, no code fences.

JSON shape:
{
  "valid": true,
  "category": "coding" | "trivia" | "logic" | "math" | "writing" | "design" | "meme",
  "title": "punchy 3-5 word title",
  "difficulty": "rookie" | "challenger" | "elite" | "legendary",
  "taskNormalised": "cleaned, structured version of the task shown to players",
  "starterCode": "JS function skeleton (coding only)",
  "publicTests": [{"input": "...", "expectedOutput": "..."}],
  "hiddenTests": [{"input": "...", "expectedOutput": "..."}],
  "canonicalAnswer": "correct answer (trivia/logic/math only)"
}

If invalid:
{
  "valid": false,
  "invalidReason": "short reason"
}`;

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return unauthorized();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI analysis unavailable — GEMINI_API_KEY not configured" },
      { status: 503 }
    );
  }

  const { taskRaw, arenaName } = await req.json() as { taskRaw: string; arenaName?: string };

  if (!taskRaw?.trim()) {
    return NextResponse.json({ error: "Task text is required" }, { status: 400 });
  }

  const userMessage = arenaName
    ? `Arena: "${arenaName}"\n\nChallenge:\n${taskRaw}`
    : `Challenge:\n${taskRaw}`;

  try {
    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ parts: [{ text: userMessage }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("[analyse] Gemini error:", errText);
      return NextResponse.json({ error: "AI analysis failed" }, { status: 502 });
    }

    const geminiData = await geminiRes.json();
    const rawText: string =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

    let analysis: AnalysisResult;
    try {
      analysis = JSON.parse(rawText);
    } catch {
      return NextResponse.json({ error: "Could not parse AI response" }, { status: 502 });
    }

    return NextResponse.json({ analysis });
  } catch (err) {
    console.error("[analyse] fetch error:", err);
    return NextResponse.json({ error: "AI service unreachable" }, { status: 503 });
  }
}
