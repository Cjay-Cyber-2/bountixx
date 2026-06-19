/** Parse pasted text into separate questions (Render env-style: one per line). */
export function parseBulkQuestions(text: string): string[] {
  const trimmed = text.trim();
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
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean)
          .join(" "),
      )
      .filter((block) => block.length > 0);
  }

  return trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .map((line) => line.replace(/^\s*(?:\d+[\.\)]\s*|[-•*]\s+)/, "").trim())
    .filter((line) => line.length > 0);
}

export function isBulkQuestionPaste(text: string): boolean {
  return parseBulkQuestions(text).length >= 2;
}
