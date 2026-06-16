export type AnalysisResult = {
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
  const gemini = process.env.GEMINI_API_KEY?.trim();
  if (gemini) return { provider: "gemini", apiKey: gemini };

  const groq = process.env.GROQ_API_KEY?.trim();
  if (groq) return { provider: "groq", apiKey: groq };

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
        temperature: 0.3,
        maxOutputTokens: 4096,
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
      temperature: 0.3,
      max_tokens: 4096,
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

export async function analyseChallenge(userMessage: string): Promise<AnalysisResult> {
  const resolved = resolveProvider();
  if (!resolved) {
    throw new AiConfigError(missingAiKeyMessage());
  }

  if (resolved.provider === "gemini") {
    return analyseWithGemini(resolved.apiKey, userMessage);
  }

  return analyseWithGroq(resolved.apiKey, userMessage);
}

export function activeAiProvider(): Provider | null {
  return resolveProvider()?.provider ?? null;
}
