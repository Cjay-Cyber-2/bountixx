import { friendlyErrorMessage } from "./apiErrors";

/**
 * Reads a JSON (or plain-text) error body from a failed API response.
 * Avoids throwing when the server returns HTML or an empty body.
 */
export async function readApiError(res: Response): Promise<string> {
  const text = await res.text().catch(() => "");
  if (!text) {
    return friendlyErrorMessage(res.status, null);
  }

  try {
    const data = JSON.parse(text) as { error?: string; message?: string; code?: string };
    return friendlyErrorMessage(res.status, data);
  } catch {
    return friendlyErrorMessage(res.status, text);
  }
}
