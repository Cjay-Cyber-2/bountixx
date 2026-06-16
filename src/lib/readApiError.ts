/**
 * Reads a JSON (or plain-text) error body from a failed API response.
 * Avoids throwing when the server returns HTML or an empty body.
 */
export async function readApiError(res: Response): Promise<string> {
  const text = await res.text().catch(() => "");
  if (!text) return `Request failed (${res.status})`;

  try {
    const data = JSON.parse(text) as { error?: string };
    if (data.error) return data.error;
  } catch {
    // not JSON — fall through to raw text
  }

  return text.length > 240 ? `${text.slice(0, 240)}…` : text;
}
