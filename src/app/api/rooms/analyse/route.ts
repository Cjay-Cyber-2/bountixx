export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession, unauthorized } from "@/lib/getSession";
import { LANGUAGE_KEYS, isLanguageKey, type LanguageKey } from "@/lib/languages";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

type AnalysisResult = {
  valid: boolean;
  invalidReason?: string;
  // Vague-but-real tasks: valid stays true, but the creator must clarify first.
  needsClarification?: boolean;
  clarificationReason?: string;
  suggestions?: string[];
  category: "coding" | "trivia" | "logic" | "math" | "writing" | "design" | "meme";
  title: string;
  difficulty: "rookie" | "challenger" | "elite" | "legendary";
  taskNormalised: string;
  // Coding-only:
  language?: LanguageKey | null;
  ioFormat?: string;
  starterCode?: string;
  publicTests?: { input: string; expectedOutput: string }[];
  hiddenTests?: { input: string; expectedOutput: string }[];
  // Non-coding:
  canonicalAnswer?: string;
};

const SYSTEM_PROMPT = `You are the Bountixx AI Arena Engine. You read a challenge a user wants to host and return ONLY a JSON object (no markdown, no code fences) describing the environment players will solve it in.

CLASSIFY the task into one category:
- "coding": writing a program/function (algorithms, data structures, output problems).
- "trivia": general-knowledge question with one factual answer.
- "logic": puzzle/riddle/lateral-thinking with one objective answer.
- "math": calculation/equation/proof with one numeric or exact answer.
- "writing" / "design" / "meme": open-ended creative tasks judged by humans.

VALIDITY:
- valid=false ONLY if the task is nonsense, spam, offensive, or impossible to solve. Give a short invalidReason.
- Otherwise valid=true.

CLARIFICATION (very important):
- If the task is REAL but too VAGUE to build a fair room, set needsClarification=true and explain exactly what is missing in clarificationReason, plus 1-3 concrete "suggestions" the host can choose from.
- A CODING task with NO programming language stated is the most common case: set needsClarification=true, clarificationReason="No programming language was specified for this coding challenge.", and suggestions like ["Python","JavaScript"].
- Other vague cases: ambiguous expected answer, missing constraints, multiple valid interpretations.
- When needsClarification=true you may leave tests/answer empty.

CODING TASKS (when language is known):
- "language" MUST be one of: ${LANGUAGE_KEYS.join(", ")}.
- The execution model is STDIN -> STDOUT. The player's program reads the ENTIRE input from standard input and prints ONLY the answer to standard output.
- "starterCode": a minimal, COMPLETE, runnable program in the chosen language that reads stdin and has a clear TODO where the player writes their logic. It must compile/run as-is.
- "ioFormat": one sentence describing what is read from stdin and what must be printed to stdout.
- Generate exactly 5 "publicTests" and 20 "hiddenTests". Each test is {"input": "<stdin>", "expectedOutput": "<exact stdout, no trailing prose>"}. Cover edge cases (empty, boundaries, negatives, large). expectedOutput must be EXACTLY what a correct program prints (whitespace-trimmed comparison is used).

NON-CODING TASKS:
- Provide "canonicalAnswer": the single correct answer players must match (case-insensitive, whitespace-normalised). For writing/design/meme leave it empty (host/manual judged).

Always provide: a punchy 3-5 word "title", a "difficulty" of rookie|challenger|elite|legendary, and "taskNormalised" (a clean, well-structured restatement of the task shown to players).

JSON shape:
{
  "valid": true,
  "needsClarification": false,
  "clarificationReason": "",
  "suggestions": [],
  "category": "coding",
  "title": "...",
  "difficulty": "challenger",
  "taskNormalised": "...",
  "language": "python",
  "ioFormat": "Read a single line string from stdin; print its reverse.",
  "starterCode": "import sys\\n\\ndata = sys.stdin.read().strip()\\n# TODO\\n",
  "publicTests": [{"input": "abc", "expectedOutput": "cba"}],
  "hiddenTests": [{"input": "", "expectedOutput": ""}],
  "canonicalAnswer": ""
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

  const { taskRaw, arenaName, languageHint } = (await req.json()) as {
    taskRaw: string;
    arenaName?: string;
    languageHint?: string;
  };

  if (!taskRaw?.trim()) {
    return NextResponse.json({ error: "Task text is required" }, { status: 400 });
  }

  // If the host has picked a language to resolve a vague coding task, force it.
  const hint = isLanguageKey(languageHint) ? languageHint : null;

  const userMessage = [
    arenaName ? `Arena: "${arenaName}"` : null,
    hint
      ? `The host has chosen this programming language for the coding challenge: "${hint}". Treat the language as specified and do NOT ask for clarification about the language.`
      : null,
    `Challenge:\n${taskRaw}`,
  ]
    .filter(Boolean)
    .join("\n\n");

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
        temperature: 0.2,
        max_tokens: 6000,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(45_000),
    });

    if (!groqRes.ok) {
      let errDetail = `Groq HTTP ${groqRes.status}`;
      try {
        const errBody = (await groqRes.json()) as { error?: { message?: string } };
        errDetail = errBody?.error?.message ?? errDetail;
      } catch {
        errDetail = (await groqRes.text().catch(() => errDetail)) || errDetail;
      }
      console.error("[analyse] Groq error:", errDetail);
      return NextResponse.json({ error: errDetail }, { status: 502 });
    }

    const groqData = (await groqRes.json()) as {
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

    // ── Server-side normalisation / safety net ──
    if (analysis.category === "coding") {
      // Honour the host's chosen language if provided.
      if (hint) {
        analysis.language = hint;
        analysis.needsClarification = false;
      }
      // Coding with no valid language => must clarify.
      if (!isLanguageKey(analysis.language)) {
        analysis.language = null;
        analysis.needsClarification = true;
        analysis.clarificationReason =
          analysis.clarificationReason ||
          "No programming language was specified for this coding challenge.";
        if (!analysis.suggestions?.length) {
          analysis.suggestions = ["Python", "JavaScript"];
        }
      }
    } else {
      analysis.language = null;
    }

    return NextResponse.json({ analysis });
  } catch (err) {
    console.error("[analyse] fetch error:", err);
    return NextResponse.json({ error: "AI service unreachable" }, { status: 503 });
  }
}
