import "server-only";

import { isAiRateLimitError } from "./apiErrors";

/** Parse one or more Groq keys from env (comma, semicolon, or newline separated). */
export function parseGroqApiKeys(raw?: string | null): string[] {
  if (!raw?.trim()) return [];

  const keys = raw
    .split(/[,;\n]+/)
    .map((key) => key.trim())
    .filter((key) => key.length > 0);

  // De-dupe while preserving order
  return [...new Set(keys)];
}

/** All configured Groq API keys (primary env + optional numbered fallbacks). */
export function listGroqApiKeys(): string[] {
  const primary = parseGroqApiKeys(process.env.GROQ_API_KEY);
  if (primary.length > 0) return primary;

  const numbered: string[] = [];
  for (let i = 1; i <= 10; i++) {
    const key = process.env[`GROQ_API_KEY_${i}`]?.trim();
    if (key) numbered.push(key);
  }

  return [...new Set(numbered)];
}

export function hasGroqApiKeys(): boolean {
  return listGroqApiKeys().length > 0;
}

export function groqApiKeyCount(): number {
  return listGroqApiKeys().length;
}

export class GroqApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "GroqApiError";
    this.status = status;
  }
}

export function isRotatableGroqError(err: unknown): boolean {
  if (err instanceof GroqApiError) {
    if (err.status === 429 || err.status === 401 || err.status === 403) return true;
    return isAiRateLimitError(err.message);
  }
  if (err instanceof Error) return isAiRateLimitError(err.message);
  return false;
}

export async function readGroqHttpError(res: Response): Promise<string> {
  const fallback = `Groq HTTP ${res.status}`;
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

/**
 * Run a Groq API call with silent key rotation on rate limits or dead keys.
 * Only throws after every configured key has been tried.
 */
export async function withGroqKeyRotation<T>(
  logLabel: string,
  run: (apiKey: string, keyIndex: number, keyCount: number) => Promise<T>,
): Promise<T> {
  const keys = listGroqApiKeys();
  if (keys.length === 0) {
    throw new GroqApiError("No Groq API keys configured", 503);
  }

  let lastError: GroqApiError | null = null;

  for (let i = 0; i < keys.length; i++) {
    try {
      return await run(keys[i], i, keys.length);
    } catch (err) {
      if (!isRotatableGroqError(err)) throw err;

      const normalized =
        err instanceof GroqApiError
          ? err
          : new GroqApiError(err instanceof Error ? err.message : String(err), 429);

      lastError = normalized;

      if (i < keys.length - 1) {
        console.warn(
          `[groq:${logLabel}] key ${i + 1}/${keys.length} unavailable, rotating to next key`,
        );
      }
    }
  }

  throw lastError ?? new GroqApiError("All Groq API keys exhausted", 429);
}
