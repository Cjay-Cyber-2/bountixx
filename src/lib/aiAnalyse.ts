import { LANGUAGE_KEYS, isLanguageKey, type LanguageKey } from "./languages";

export type AnalysisResult = {
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
- If the task is REAL but too VAGUE to build a fair room, set needsClarification=true and explain what is missing in clarificationReason, plus 1-3 concrete "suggestions" the host can choose from.
- A CODING task with NO programming language stated is the most common case: set needsClarification=true, clarificationReason="No programming language was specified for this coding challenge.", and suggestions like ["Python","JavaScript"].
- Other vague cases: ambiguous expected answer, missing constraints, multiple valid interpretations.
- When needsClarification=true you may leave tests/answer empty.

CODING TASKS (when language is known):
- "language" MUST be one of: ${LANGUAGE_KEYS.join(", ")}.
- The execution model is STDIN -> STDOUT. The player's program reads the ENTIRE input from standard input and prints ONLY the answer to standard output.
- "starterCode": a minimal, COMPLETE, runnable program in the chosen language that reads stdin and has a clear TODO where the player writes their logic. It must compile/run as-is.
- "ioFormat": one sentence describing what is read from stdin and what must be printed to stdout.
- Generate exactly 5 "publicTests" and 20 "hiddenTests". Each test is {"input": "<stdin>", "expectedOutput": "<exact stdout>"}. Cover edge cases (empty, boundaries, negatives, large). expectedOutput must be EXACTLY what a correct program prints (whitespace-trimmed comparison is used).

NON-CODING TASKS:
- Provide "canonicalAnswer": the single correct answer players must match (case-insensitive, whitespace-normalised). For writing/design/meme leave it empty (host/manual judged).

Always provide: a punchy 3-5 word "title", a "difficulty" of rookie|challenger|elite|legendary, and "taskNormalised" (a clean, well-structured restatement shown to players).

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
  "ioFormat": "Read a single line from stdin; print its reverse.",
  "starterCode": "import sys\\n\\ndata = sys.stdin.read().strip()\\n# TODO\\n",
  "publicTests": [{"input": "abc", "expectedOutput": "cba"}],
  "hiddenTests": [{"input": "", "expectedOutput": ""}],
  "canonicalAnswer": ""
}

If invalid: {"valid": false, "invalidReason": "short reason"}`;

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

type Provider = "gemini" | "groq";

export class AiConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiConfigError";
  }
}

export class AiProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiProviderError";
  }
}

export class AiParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiParseError";
  }
}

function resolveProvider(): { provider: Provider; apiKey: string } | null {
  const groq = process.env.GROQ_API_KEY?.trim();
  if (groq) return { provider: "groq", apiKey: groq };

  const gemini = process.env.GEMINI_API_KEY?.trim();
  if (gemini) return { provider: "gemini", apiKey: gemini };

  return null;
}

export function missingAiKeyMessage(): string {
  return "AI analysis unavailable — set GEMINI_API_KEY or GROQ_API_KEY in Vercel, then redeploy";
}

async function readHttpError(res: Response, label: string): Promise<string> {
  const fallback = `${label} HTTP ${res.status}`;
  const text = await res.text().catch(() => "");
  if (!text) return fallback;

  try {
    const body = JSON.parse(text) as {
      error?: { message?: string } | string;
      message?: string;
    };
    if (typeof body.error === "string") return body.error;
    if (body.error && typeof body.error.message === "string") return body.error.message;
    if (typeof body.message === "string") return body.message;
  } catch {
    // not JSON
  }

  return text.length > 240 ? `${text.slice(0, 240)}…` : text;
}

function parseAnalysis(rawText: string): AnalysisResult {
  try {
    return JSON.parse(rawText) as AnalysisResult;
  } catch {
    console.error("[analyse] Failed to parse AI response:", rawText.slice(0, 200));
    throw new AiParseError("Could not parse AI response");
  }
}

async function analyseWithGemini(apiKey: string, userMessage: string): Promise<AnalysisResult> {
  const geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: userMessage }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 6000,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!geminiRes.ok) {
    const errDetail = await readHttpError(geminiRes, "Gemini");
    console.error("[analyse] Gemini error:", errDetail);
    throw new AiProviderError(errDetail);
  }

  const geminiData = (await geminiRes.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  return parseAnalysis(rawText);
}

async function analyseWithGroq(apiKey: string, userMessage: string): Promise<AnalysisResult> {
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
  });

  if (!groqRes.ok) {
    const errDetail = await readHttpError(groqRes, "Groq");
    console.error("[analyse] Groq error:", errDetail);
    throw new AiProviderError(errDetail);
  }

  const groqData = (await groqRes.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const rawText = groqData?.choices?.[0]?.message?.content ?? "{}";
  return parseAnalysis(rawText);
}

/** Force/repair the coding language and clarification flags after the model returns. */
function normaliseAnalysis(analysis: AnalysisResult, languageHint?: string): AnalysisResult {
  const hint = isLanguageKey(languageHint) ? languageHint : null;

  if (analysis.category === "coding") {
    if (hint) {
      analysis.language = hint;
      analysis.needsClarification = false;
    }
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

  return analysis;
}

export async function analyseChallenge(
  userMessage: string,
  languageHint?: string
): Promise<AnalysisResult> {
  const resolved = resolveProvider();
  if (!resolved) {
    throw new AiConfigError(missingAiKeyMessage());
  }

  const result =
    resolved.provider === "gemini"
      ? await analyseWithGemini(resolved.apiKey, userMessage)
      : await analyseWithGroq(resolved.apiKey, userMessage);

  return normaliseAnalysis(result, languageHint);
}

export function activeAiProvider(): Provider | null {
  return resolveProvider()?.provider ?? null;
}
