/** Question openers used when pasted text has no line breaks between items. */
const QUESTION_OPENER =
  "(?:What|Who|Where|When|Which|How|Can|Is|Are|True or False|Explain|Describe|Define|Name|List|Calculate|Solve|Write|Implement)";

function normalizeLineBreaks(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[\u2028\u2029]/g, "\n");
}

function stripListPrefix(line: string): string {
  return line.replace(/^\s*(?:\d+[\.\)]\s*|[-•*]\s+)/, "").trim();
}

/** Split run-on questions like "Go?True or False...;).What numeric..." */
function splitConcatenatedBlock(text: string): string[] {
  let parts = [text.trim()];

  const splitters = [
    /(?<=\?)(?=[A-Z])/,
    new RegExp(`(?<=[.?!;)])\\s*(?=${QUESTION_OPENER}\\b)`, "i"),
  ];

  for (const splitter of splitters) {
    const next: string[] = [];
    for (const part of parts) {
      const chunks = part
        .split(splitter)
        .map((chunk) => chunk.trim())
        .filter((chunk) => chunk.length > 0);
      next.push(...(chunks.length > 1 ? chunks : [part]));
    }
    parts = next;
  }

  return parts;
}

/** Best-effort plain text from clipboard HTML (Google Docs, Word, etc.). */
export function plainTextFromClipboardHtml(html: string): string {
  if (!html.trim()) return "";
  if (typeof document === "undefined") return "";

  const doc = new DOMParser().parseFromString(html, "text/html");
  const text = doc.body.textContent ?? "";
  return text.replace(/\u00a0/g, " ").trim();
}

/** Read clipboard payload and return question lines when it looks like a bulk paste. */
export function readClipboardQuestions(data: DataTransfer | null): string[] | null {
  if (!data) return null;

  const plain = data.getData("text/plain")?.trim() ?? "";
  const html = data.getData("text/html")?.trim() ?? "";
  const candidates = [plain, plainTextFromClipboardHtml(html)].filter(Boolean);

  for (const candidate of candidates) {
    const lines = parseBulkQuestions(candidate);
    if (lines.length >= 2) return lines;
  }

  return null;
}

/** Parse pasted text into separate questions (one per line, or run-on blocks). */
export function parseBulkQuestions(text: string): string[] {
  const trimmed = normalizeLineBreaks(text.trim());
  if (!trimmed) return [];

  // Spreadsheet row: tab-separated cells on one line
  if (!trimmed.includes("\n") && trimmed.includes("\t")) {
    return trimmed
      .split("\t")
      .map((cell) => cell.trim())
      .filter((cell) => cell.length > 0);
  }

  // Paragraph blocks separated by blank lines
  if (/\n\s*\n/.test(trimmed)) {
    return trimmed
      .split(/\n\s*\n/)
      .map((block) =>
        block
          .split(/\n/)
          .map((line) => stripListPrefix(line.trim()))
          .filter(Boolean)
          .join(" "),
      )
      .filter((block) => block.length > 0);
  }

  const lines = trimmed
    .split(/\n/)
    .map((line) => stripListPrefix(line.trim()))
    .filter((line) => line.length > 0);

  if (lines.length >= 2) return lines;

  const singleBlock = lines.length === 1 ? lines[0] : trimmed.replace(/\n+/g, " ").trim();
  const concatenated = splitConcatenatedBlock(singleBlock);
  if (concatenated.length >= 2) return concatenated;

  return lines;
}

export function isBulkQuestionPaste(text: string): boolean {
  return parseBulkQuestions(text).length >= 2;
}

/** Detect paste-like jumps (fallback when onPaste does not fire). */
export function looksLikeBulkQuestionInput(prev: string, next: string): boolean {
  if (next.length <= prev.length + 8) return false;
  return parseBulkQuestions(next).length >= 2;
}
