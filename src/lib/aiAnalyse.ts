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

CLASSIFY the task into exactly one category:
- "coding": ONLY when the player must write/complete a program or function (algorithms, data structures, stdin/stdout problems). Requires explicit programming work.
- "trivia": general-knowledge questions with one factual answer (What/Who/Where/When/Which/How many…).
- "logic": puzzle/riddle/lateral-thinking with one objective answer.
- "math": calculation/equation with one numeric or exact answer.
- "writing" / "design" / "meme": open-ended creative tasks judged by humans.

CRITICAL — NEVER misclassify:
- Questions like "What is the capital of France?" or "Who wrote Hamlet?" are TRIVIA, never coding.
- Do NOT return language, starterCode, ioFormat, publicTests, or hiddenTests for trivia/logic/math/writing/design/meme.
- Trivia/logic/math rooms are answered by typing text — there is NO code editor and NO Python execution.

VALIDITY:
- valid=false ONLY if the task is nonsense, spam, offensive, or impossible to solve. Give a short invalidReason.
- Otherwise valid=true.

CLARIFICATION (very important):
- If the task is REAL but too VAGUE to build a fair room, set needsClarification=true and explain what is missing in clarificationReason, plus 1-3 concrete "suggestions" the host can choose from.
- A CODING task with NO programming language stated: set needsClarification=true, clarificationReason="No programming language was specified for this coding challenge.", suggestions like ["Python","JavaScript"].
- When needsClarification=true you may leave tests/answer empty.

CODING TASKS (category="coding" ONLY, when language is known):
- "language" MUST be one of: ${LANGUAGE_KEYS.join(", ")}.
- STDIN -> STDOUT execution model.
- "starterCode": minimal runnable program with a TODO for player logic.
- "ioFormat": one sentence on stdin/stdout.
- Exactly 5 "publicTests" and 20 "hiddenTests": {"input":"<stdin>","expectedOutput":"<exact stdout>"}.
- Leave "canonicalAnswer" empty for coding.

NON-CODING TASKS (trivia, logic, math):
- "canonicalAnswer" is REQUIRED: one specific, verifiable fact the grader treats as ground truth.
- For math: the exact numeric result only (e.g. "42", "847.5") — no units or explanation.
- For trivia: the accepted proper name, place, date, or yes/no (e.g. "Paris", "William Shakespeare", "1945", "No").
- For logic: the single objective solution in ≤12 words (e.g. "3", "The man is lying").
- NEVER use vague answers: no "depends", "various", "unknown", "probably", full sentences, or hedging.
- If you cannot name ONE definitive answer, set needsClarification=true instead of guessing.
- "taskNormalised" must be a clear, self-contained question players can answer without extra context.
- Do NOT include language, starterCode, ioFormat, publicTests, or hiddenTests.
- For writing/design/meme leave canonicalAnswer empty — AI judges open-ended answers from the question alone.

Always provide: punchy 3-5 word "title", "difficulty" (rookie|challenger|elite|legendary), and "taskNormalised" (clean restatement for players).

Trivia example:
{"valid":true,"needsClarification":false,"category":"trivia","title":"Capital of France","difficulty":"rookie","taskNormalised":"What is the capital of France?","canonicalAnswer":"Paris"}

Coding example:
{"valid":true,"needsClarification":false,"category":"coding","title":"Reverse a String","difficulty":"challenger","taskNormalised":"Write a program that reads a line from stdin and prints its reverse.","language":"python","ioFormat":"Read one line; print its reverse.","starterCode":"import sys\\n\\ndata = sys.stdin.read().strip()\\n# TODO\\n","publicTests":[{"input":"abc","expectedOutput":"cba"}],"hiddenTests":[{"input":"","expectedOutput":""}],"canonicalAnswer":""}

If invalid: {"valid": false, "invalidReason": "short reason"}`;

const ANSWER_PROMPT = `You are a strict fact-checker for a competitive multiplayer arena. Given a challenge, return ONLY JSON:
{"canonicalAnswer":"<answer>","confident":true|false,"issue":"<short reason if not confident>"}

Rules:
- canonicalAnswer must be ONE specific, verifiable fact — a name, place, date, number, or yes/no.
- BANNED: explanations, full sentences, hedging ("probably", "around", "depends"), or multi-part answers.
- Trivia: use the standard accepted form (e.g. "Paris", not "the capital of France"; "William Shakespeare", not "Shakespeare").
- Math: solve step-by-step internally, return the exact numeric result only (e.g. "847", "-12.5").
- Logic: the single objective solution in ≤12 words.
- If the challenge is ambiguous, subjective, or you are not highly confident, set confident:false, canonicalAnswer:"", and explain in issue.
- Do not guess. Wrong answers disqualify players unfairly.`;

type TaskCategory = AnalysisResult["category"];
type Provider = "gemini" | "groq";

const VAGUE_ANSWER_PATTERNS =
  /^(it depends|depends|various|several|many|some|unknown|not sure|maybe|probably|approximately|around|roughly|about|unclear|n\/a|none|nothing|anything|something|someone|anyone|a lot|lots of|multiple|different|could be|might be|i think|i believe|possibly)\b/i;

const EXPLANATORY_ANSWER_PATTERNS =
  /\b(because|which is|that is|this is|due to|in order to|as well as|such as|for example|meaning that)\b/i;

type ResolvedAnswer = {
  answer: string;
  confident: boolean;
  issue?: string;
};

/** Returns true when an answer is specific enough to grade fairly. */
export function isConcreteAnswer(answer: string, category: TaskCategory): boolean {
  const trimmed = answer.trim();
  if (!trimmed) return false;
  if (trimmed.length > 120) return false;
  if (VAGUE_ANSWER_PATTERNS.test(trimmed)) return false;
  if (EXPLANATORY_ANSWER_PATTERNS.test(trimmed)) return false;
  if ((trimmed.match(/[.!?]/g) ?? []).length > 1) return false;

  if (category === "math") {
    return extractMathNumber(trimmed) !== null;
  }

  if (category === "trivia" || category === "logic") {
    const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
    if (wordCount > 16) return false;
  }

  return true;
}

function extractMathNumber(s: string): number | null {
  const cleaned = s.replace(/,/g, "").trim();
  const match = cleaned.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const n = Number(match[0]);
  return Number.isFinite(n) ? n : null;
}

function answerResolverProvider(): { provider: Provider; apiKey: string } | null {
  const gemini = process.env.GEMINI_API_KEY?.trim();
  if (gemini) return { provider: "gemini", apiKey: gemini };

  const groq = process.env.GROQ_API_KEY?.trim();
  if (groq) return { provider: "groq", apiKey: groq };

  return null;
}

function markAnswerClarification(analysis: AnalysisResult, reason: string): void {
  analysis.needsClarification = true;
  analysis.clarificationReason =
    analysis.clarificationReason ||
    reason ||
    "The AI could not determine one definitive answer. Make the question more specific, then re-analyze.";
  if (!analysis.suggestions?.length) {
    analysis.suggestions = [
      "Add the exact year, name, or number you expect",
      "Rephrase as a single clear question with one factual answer",
    ];
  }
}

function applyResolvedAnswer(
  analysis: AnalysisResult,
  resolved: ResolvedAnswer,
  taskText: string,
): void {
  const candidate = resolved.answer.trim();
  const category = analysis.category;

  if (resolved.confident && candidate && isConcreteAnswer(candidate, category)) {
    analysis.canonicalAnswer = candidate;
    analysis.needsClarification = false;
    return;
  }

  const fallback = analysis.canonicalAnswer?.trim() ?? "";
  if (fallback && isConcreteAnswer(fallback, category)) {
    if (!resolved.confident && resolved.issue) {
      console.warn("[analyse] Kept first-pass answer after low-confidence fact-check:", taskText.slice(0, 80));
    }
    return;
  }

  markAnswerClarification(
    analysis,
    resolved.issue ||
      "The AI could not produce one specific, verifiable answer. Edit the question or type the correct answer yourself.",
  );
}

const CODING_SIGNALS =
  /\b(implement|write\s+(a\s+)?(program|function|code|script|algorithm)|leetcode|hackerrank|stdin|stdout|compile|binary\s+search|sort\s+an?\s+array|reverse\s+a\s+string|data\s+structure|time\s+complexity|o\s*\(\s*n|class\s+\w+|def\s+\w+\s*\(|function\s+\w+\s*\()/i;

const TRIVIA_SIGNALS =
  /^(what|who|where|when|which|how\s+many|how\s+much|name\s+the|in\s+what\s+year|true\s+or\s+false|is\s+it\s+true)/i;

const MATH_SIGNALS =
  /^(calculate|compute|solve|evaluate|what\s+is\s+[\d\(]|\d+\s*[\+\-\*\/×÷\^]\s*\d+|find\s+the\s+(value|sum|product|result))/i;

const LOGIC_SIGNALS =
  /^(if\s+you|suppose|puzzle|riddle|logic|brain\s*teaser|there\s+are\s+\d+\s+(people|boxes|balls))/i;

function extractTaskText(userMessage: string): string {
  const match = userMessage.match(/Challenge:\n([\s\S]*)$/);
  return (match?.[1] ?? userMessage).trim();
}

/** Heuristic pre-classification from raw task text — catches obvious trivia/math mislabeled as coding. */
function inferCategoryFromTask(task: string): TaskCategory | null {
  const t = task.trim();
  if (!t) return null;

  if (MATH_SIGNALS.test(t)) return "math";
  if (LOGIC_SIGNALS.test(t)) return "logic";
  if (TRIVIA_SIGNALS.test(t)) return "trivia";
  if (/\?\s*$/.test(t) && !CODING_SIGNALS.test(t)) return "trivia";

  return null;
}

function stripCodingArtifacts(analysis: AnalysisResult): void {
  analysis.language = null;
  delete analysis.starterCode;
  delete analysis.ioFormat;
  delete analysis.publicTests;
  delete analysis.hiddenTests;
}

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

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
        temperature: 0.1,
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
      temperature: 0.1,
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

/** Force/repair category, language, and clarification flags after the model returns. */
function normaliseAnalysis(
  analysis: AnalysisResult,
  languageHint?: string,
  taskText?: string
): { analysis: AnalysisResult; reclassified: boolean } {
  const hint = isLanguageKey(languageHint) ? languageHint : null;
  let reclassified = false;

  const inferred = taskText ? inferCategoryFromTask(taskText) : null;
  if (
    analysis.category === "coding" &&
    inferred &&
    inferred !== "coding" &&
    !hint &&
    !CODING_SIGNALS.test(taskText ?? "")
  ) {
    analysis.category = inferred;
    reclassified = true;
    analysis.needsClarification = false;
    stripCodingArtifacts(analysis);
  }

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
    stripCodingArtifacts(analysis);
    if (!["writing", "design", "meme"].includes(analysis.category) && reclassified) {
      analysis.needsClarification = false;
    }
  }

  return { analysis, reclassified };
}

async function resolveCanonicalAnswer(
  category: TaskCategory,
  taskText: string,
): Promise<ResolvedAnswer> {
  const resolved = answerResolverProvider();
  if (!resolved) {
    return { answer: "", confident: false, issue: missingAiKeyMessage() };
  }

  const userMessage = `Category: ${category}\nChallenge:\n${taskText}`;

  try {
    if (resolved.provider === "gemini") {
      const geminiRes = await fetch(`${GEMINI_API_URL}?key=${resolved.apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: ANSWER_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: userMessage }] }],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 256,
            responseMimeType: "application/json",
          },
        }),
      });
      if (!geminiRes.ok) {
        return { answer: "", confident: false, issue: "Fact-check service unavailable" };
      }
      const data = (await geminiRes.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
      const parsed = JSON.parse(raw) as {
        canonicalAnswer?: string;
        confident?: boolean;
        issue?: string;
      };
      return {
        answer: parsed.canonicalAnswer?.trim() ?? "",
        confident: parsed.confident !== false,
        issue: parsed.issue?.trim(),
      };
    }

    const groqRes = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resolved.apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: ANSWER_PROMPT },
          { role: "user", content: userMessage },
        ],
        temperature: 0,
        max_tokens: 256,
        response_format: { type: "json_object" },
      }),
    });
    if (!groqRes.ok) {
      return { answer: "", confident: false, issue: "Fact-check service unavailable" };
    }
    const data = (await groqRes.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = data?.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as {
      canonicalAnswer?: string;
      confident?: boolean;
      issue?: string;
    };
    return {
      answer: parsed.canonicalAnswer?.trim() ?? "",
      confident: parsed.confident !== false,
      issue: parsed.issue?.trim(),
    };
  } catch {
    return { answer: "", confident: false, issue: "Could not verify the answer" };
  }
}

export async function analyseChallenge(
  userMessage: string,
  languageHint?: string
): Promise<AnalysisResult> {
  const resolved = resolveProvider();
  if (!resolved) {
    throw new AiConfigError(missingAiKeyMessage());
  }

  const taskText = extractTaskText(userMessage);

  const result =
    resolved.provider === "gemini"
      ? await analyseWithGemini(resolved.apiKey, userMessage)
      : await analyseWithGroq(resolved.apiKey, userMessage);

  const { analysis, reclassified } = normaliseAnalysis(result, languageHint, taskText);

  const needsAnswer =
    ["trivia", "logic", "math"].includes(analysis.category) &&
    analysis.valid &&
    !analysis.needsClarification;

  if (needsAnswer) {
    const resolved = await resolveCanonicalAnswer(analysis.category, taskText);
    applyResolvedAnswer(analysis, resolved, taskText);

    const finalAnswer = analysis.canonicalAnswer?.trim() ?? "";
    if (finalAnswer && !isConcreteAnswer(finalAnswer, analysis.category)) {
      analysis.canonicalAnswer = "";
      markAnswerClarification(
        analysis,
        "The AI answer was too vague. Add a specific expected answer or make the question clearer.",
      );
    }
  }

  return analysis;
}

export function activeAiProvider(): Provider | null {
  return resolveProvider()?.provider ?? null;
}
