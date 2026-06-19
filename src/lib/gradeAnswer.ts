import { missingAiKeyMessage } from "./aiAnalyse";

export type AnswerVerdict = "correct" | "close_enough" | "incorrect";

export type GradeResult = {
  accepted: boolean;
  verdict: AnswerVerdict;
  feedback?: string;
};

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

const GRADE_PROMPT = `You are the Bountixx answer judge for a competitive arena. Grade whether a player's typed answer should PASS.

Return ONLY JSON:
{
  "verdict": "correct" | "close_enough" | "incorrect",
  "feedback": "one short sentence for the player"
}

When a reference answer is provided, treat it as verified ground truth.

Verdict rules:
- "correct": factually equivalent to the reference — same entity, number, date, or meaning.
- "close_enough": clearly the same answer with minor typos, abbreviations, or harmless rephrasing (e.g. "Shakespeare" vs "William Shakespeare" when the reference is "William Shakespeare").
- "incorrect": wrong fact, different entity, unrelated, hedging, or too vague — even if it sounds plausible.

Strictness:
- Do NOT accept wrong facts, educated guesses, or "close but wrong" answers.
- For math: only accept if the numeric value matches the reference (allow equivalent forms like 42 vs 42.0).
- For trivia: the player must name the same person, place, date, or fact as the reference.
- For logic: accept equivalent explanations of the same solution.
- For open-ended questions without a reference: judge whether the core idea is substantively correct.
- Prefer "incorrect" when uncertain. Players need fair, accurate grading.`;

type Provider = "gemini" | "groq";

function resolveProvider(): { provider: Provider; apiKey: string } | null {
  const groq = process.env.GROQ_API_KEY?.trim();
  if (groq) return { provider: "groq", apiKey: groq };

  const gemini = process.env.GEMINI_API_KEY?.trim();
  if (gemini) return { provider: "gemini", apiKey: gemini };

  return null;
}

function normaliseText(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[''`]/g, "'")
    .replace(/[^\w\s'.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripAnswerFiller(s: string): string {
  return s
    .replace(/^(the answer is|it is|it's|answer:|approximately|about)\s+/i, "")
    .replace(/^(a|an|the)\s+/i, "")
    .trim();
}

function tokenOverlapScore(player: string, reference: string): number {
  const playerTokens = new Set(stripAnswerFiller(player).split(/\s+/).filter((t) => t.length > 2));
  const refTokens = stripAnswerFiller(reference).split(/\s+/).filter((t) => t.length > 2);
  if (playerTokens.size === 0 || refTokens.length === 0) return 0;
  const overlap = refTokens.filter((t) => playerTokens.has(t)).length;
  return overlap / refTokens.length;
}

function extractNumber(s: string): number | null {
  const cleaned = s.replace(/,/g, "").trim();
  const match = cleaned.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const n = Number(match[0]);
  return Number.isFinite(n) ? n : null;
}

function tryExactMatch(playerAnswer: string, reference: string): boolean {
  const player = normaliseText(playerAnswer);
  const ref = normaliseText(reference);
  if (!player || !ref) return false;
  if (player === ref) return true;

  const strippedPlayer = stripAnswerFiller(player);
  const strippedRef = stripAnswerFiller(ref);
  if (strippedPlayer === strippedRef) return true;
  if (strippedPlayer.includes(strippedRef) || strippedRef.includes(strippedPlayer)) return true;

  return false;
}

function tryNearMatch(playerAnswer: string, reference: string): boolean {
  if (tryExactMatch(playerAnswer, reference)) return true;
  const player = stripAnswerFiller(normaliseText(playerAnswer));
  const ref = stripAnswerFiller(normaliseText(reference));
  if (!player || !ref) return false;

  if (player.length >= 4 && ref.length >= 4) {
    const maxEdits = Math.min(2, Math.floor(Math.min(player.length, ref.length) / 4));
    if (levenshtein(player, ref) <= maxEdits) return true;
  }

  return tokenOverlapScore(player, ref) >= 0.85;
}

function levenshtein(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix = Array.from({ length: rows }, () => Array<number>(cols).fill(0));

  for (let i = 0; i < rows; i++) matrix[i][0] = i;
  for (let j = 0; j < cols; j++) matrix[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[a.length][b.length];
}

function tryNumericMatch(playerAnswer: string, reference: string): boolean {
  const a = extractNumber(playerAnswer);
  const b = extractNumber(reference);
  if (a === null || b === null) return false;
  return Math.abs(a - b) < 0.001;
}

function parseGradeResponse(raw: string): { verdict: AnswerVerdict; feedback?: string } {
  try {
    const parsed = JSON.parse(raw) as { verdict?: string; feedback?: string };
    const verdict = parsed.verdict;
    if (verdict === "correct" || verdict === "close_enough" || verdict === "incorrect") {
      return { verdict, feedback: parsed.feedback?.trim() };
    }
  } catch {
    // fall through
  }
  return { verdict: "incorrect", feedback: "Could not grade answer" };
}

async function gradeWithGemini(apiKey: string, userMessage: string): Promise<{ verdict: AnswerVerdict; feedback?: string }> {
  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: GRADE_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: userMessage }] }],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 256,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) return { verdict: "incorrect", feedback: "AI grading unavailable" };

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  return parseGradeResponse(raw);
}

async function gradeWithGroq(apiKey: string, userMessage: string): Promise<{ verdict: AnswerVerdict; feedback?: string }> {
  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: GRADE_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 0,
      max_tokens: 256,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) return { verdict: "incorrect", feedback: "AI grading unavailable" };

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = data?.choices?.[0]?.message?.content ?? "{}";
  return parseGradeResponse(raw);
}

export async function gradePlayerAnswer(opts: {
  question: string;
  category: string;
  playerAnswer: string;
  canonicalAnswer?: string | null;
}): Promise<GradeResult> {
  const { question, category, playerAnswer, canonicalAnswer } = opts;
  const trimmed = playerAnswer.trim();

  if (!trimmed) {
    return { accepted: false, verdict: "incorrect", feedback: "Please enter an answer." };
  }

  const reference = canonicalAnswer?.trim() ?? "";

  if (reference && tryExactMatch(trimmed, reference)) {
    return { accepted: true, verdict: "correct" };
  }

  if (category === "math" && reference && tryNumericMatch(trimmed, reference)) {
    return { accepted: true, verdict: "correct" };
  }

  if (reference && category !== "math" && tryNearMatch(trimmed, reference)) {
    return { accepted: true, verdict: "close_enough" };
  }

  const resolved = resolveProvider();
  if (!resolved) {
    if (reference) {
      return {
        accepted: false,
        verdict: "incorrect",
        feedback: `Not close enough. ${missingAiKeyMessage()}`,
      };
    }
    return {
      accepted: false,
      verdict: "incorrect",
      feedback: missingAiKeyMessage(),
    };
  }

  const userMessage = [
    `Category: ${category}`,
    `Question: ${question}`,
    reference
      ? `Reference answer (verified ground truth — player must match this fact): ${reference}`
      : "Reference answer: (open-ended — judge from the question)",
    `Player answer: ${trimmed}`,
    reference
      ? "Grade strictly against the reference. Reject plausible-but-wrong answers."
      : "Judge whether the player's core idea is substantively correct.",
  ].join("\n");

  const graded =
    resolved.provider === "gemini"
      ? await gradeWithGemini(resolved.apiKey, userMessage)
      : await gradeWithGroq(resolved.apiKey, userMessage);

  const accepted = graded.verdict === "correct" || graded.verdict === "close_enough";

  return {
    accepted,
    verdict: graded.verdict,
    feedback: graded.feedback,
  };
}
