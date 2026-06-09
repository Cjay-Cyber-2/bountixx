export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession, unauthorized } from "@/lib/getSession";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

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

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI analysis unavailable — GROQ_API_KEY not configured" },
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
    const groqRes = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        temperature: 0.3,
        max_tokens: 4096,
        response_format: { type: "json_object" },
      }),
    });

    if (!groqRes.ok) {
      let errDetail = `Groq HTTP ${groqRes.status}`;
      try {
        const errBody = await groqRes.json() as { error?: { message?: string } };
        errDetail = errBody?.error?.message ?? errDetail;
      } catch {
        errDetail = (await groqRes.text().catch(() => errDetail)) || errDetail;
      }
      console.error("[analyse] Groq error:", errDetail);
      return NextResponse.json({ error: errDetail }, { status: 502 });
    }

    const groqData = await groqRes.json() as {
      choices?: { message?: { content?: string } }[];
    };
    const rawText: string = groqData?.choices?.[0]?.message?.content ?? "{}";

    let analysis: AnalysisResult;
    try {
      analysis = JSON.parse(rawText) as AnalysisResult;
    } catch {
      console.error("[analyse] Failed to parse Groq response:", rawText.slice(0, 200));
      return NextResponse.json({ error: "Could not parse AI response" }, { status: 502 });
    }

    return NextResponse.json({ analysis });
  } catch (err) {
    console.error("[analyse] fetch error:", err);
    return NextResponse.json({ error: "AI service unreachable" }, { status: 503 });
  }
}
