import { ENTRY_FEE } from "./coins";

type ErrorBody = {
  error?: string;
  message?: string;
  code?: string;
};

const ROBOTIC = /^(unauthorized|forbidden|not found|bad request|internal server error|error)$/i;

function isAiRateLimitish(message: string): boolean {
  return /rate limit|tokens per (minute|day|hour)|llama-3\.3|groq/i.test(message);
}

/** Turn raw API errors into copy people can actually act on. */
export function friendlyErrorMessage(
  status: number,
  body?: ErrorBody | string | null,
): string {
  const parsed: ErrorBody =
    typeof body === "string" ? { error: body } : (body ?? {});
  const raw = (parsed.error ?? parsed.message ?? "").trim();
  const code = parsed.code ?? null;
  const lower = raw.toLowerCase();

  if (code === "INSUFFICIENT_COINS" || status === 402) {
    if (raw && !ROBOTIC.test(raw)) return raw;
    return `You need at least ${ENTRY_FEE} coins to compete in this arena. Open your Wallet to get more coins.`;
  }

  if (status === 401 || code === "AUTH_REQUIRED" || lower === "unauthorized") {
    return "Please sign in to continue.";
  }

  if (status === 403) {
    if (lower.includes("not in this room")) {
      return "You're not in this arena lobby. Use the invite link to join first.";
    }
    if (lower.includes("admin") || lower.includes("host")) {
      return "Only the host can do that.";
    }
    if (raw && !ROBOTIC.test(raw)) return raw;
    return "You don't have permission to do that.";
  }

  if (status === 404) {
    if (lower.includes("expired")) {
      return "This invite link has expired. Ask the host to send a new one.";
    }
    if (lower.includes("room not found") || lower.includes("not found")) {
      return "This arena no longer exists.";
    }
    if (raw && !ROBOTIC.test(raw)) return raw;
    return "We couldn't find that arena.";
  }

  if (status === 409) {
    if (lower.includes("full")) return "This arena is full. Try another room.";
    if (lower.includes("disqualified")) {
      return "You've been disqualified from this arena.";
    }
    if (lower.includes("no longer accepting")) {
      return "This arena is no longer accepting players.";
    }
    if (raw && !ROBOTIC.test(raw)) return raw;
    return "That isn't available right now. Refresh and try again.";
  }

  if (status === 502 || status === 503) {
    if (raw && isAiRateLimitish(raw)) {
      return "Groq AI hit its daily limit. Add GEMINI_API_KEY in Vercel (recommended), or wait about an hour and try again.";
    }
    if (raw && !ROBOTIC.test(raw)) return raw;
    return "We're having trouble reaching the AI service. Please try again in a moment.";
  }

  if (raw && !ROBOTIC.test(raw)) return raw;

  if (status >= 500) return "Something went wrong on our end. Please try again.";
  if (status === 400) return "Something in that request didn't look right. Please try again.";
  return "Something went wrong. Please try again.";
}
