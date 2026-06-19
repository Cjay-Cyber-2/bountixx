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

const GRADE_PROMPT = `You are the Bountixx answer judge. Grade whether a player's typed answer should PASS for a multiplayer challenge.

Return ONLY JSON:
{
  "verdict": "correct" | "close_enough" | "incorrect",
  "feedback": "one short encouraging sentence for the player"
}

Verdict rules:
- "correct": factually right, equivalent meaning, or clearly the right solution.
- "close_enough": not word-perfect but shows the right idea — minor typos, synonyms, alternate phrasing, reasonable paraphrase, or substantially correct open-ended responses.
- "incorrect": wrong, unrelated, empty reasoning, or too far from any acceptable answer.

Be fair and generous with meaning, not pedantic about punctuation, capitalization, or exact wording.
For math: accept equivalent numeric forms (e.g. 42, 42.0, forty-two if clearly numeric intent).
For logic riddles: accept equivalent explanations of the solution.
For open-ended questions without one rigid phrasing: judge whether the player understood the core idea.
Only use "incorrect" when genuinely wrong.`;

type Provider = "gemini" | "groq";

function resolveProvider(): { provider: Provider; apiKey: string } | null {
  const groq = process.env.GROQ_API_KEY?.trim();
  if (groq) return { provider: "groq", apiKey: groq };

  const gemini = process.env.GEMINI_API_KEY?.trim();
  if (gemini) return { provider: "gemini", apiKey: gemini };

  return null;
}

function normaliseText(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
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

  // Strip common filler prefixes: "the answer is paris" → "paris"
  const stripPrefix = (s: string) =>
    s.replace(/^(the answer is|it is|it's|answer:|approximately|about)\s+/i, "").trim();
  return stripPrefix(player) === stripPrefix(ref);
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
        temperature: 0.1,
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
      temperature: 0.1,
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
    reference ? `Reference answer (ideal/best answer): ${reference}` : "Reference answer: (open-ended — judge from the question)",
    `Player answer: ${trimmed}`,
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
