/**
 * Arena countdown helpers — server is the source of truth for elapsed time.
 * Postgres timestamps without an offset are treated as UTC.
 */

export type ArenaTimerState = {
  hasTimer: boolean;
  totalSeconds: number | null;
  remainingSeconds: number | null;
  expired: boolean;
};

export function parseServerTimestamp(value: unknown): number | null {
  if (value == null) return null;
  if (value instanceof Date) {
    const ms = value.getTime();
    return Number.isFinite(ms) ? ms : null;
  }

  const raw = String(value).trim();
  if (!raw) return null;

  const hasOffset = /[zZ]$|[+-]\d{2}:\d{2}$/.test(raw);
  const normalized = hasOffset
    ? raw
    : raw.includes("T")
      ? `${raw}Z`
      : `${raw.replace(" ", "T")}Z`;

  const ms = Date.parse(normalized);
  return Number.isFinite(ms) ? ms : null;
}

export function normalizeTimerSeconds(raw: number | null | undefined): number | null {
  if (raw == null || !Number.isFinite(raw) || raw <= 0) return null;
  const value = Math.floor(raw);
  // Legacy rows stored minutes (1–59) instead of seconds.
  if (value >= 1 && value < 60) return value * 60;
  return value;
}

export function computeArenaTimer(
  timerSeconds: number | null | undefined,
  startedAt: unknown,
  nowMs: number = Date.now(),
): ArenaTimerState {
  const total = normalizeTimerSeconds(timerSeconds);

  if (total == null) {
    return { hasTimer: false, totalSeconds: null, remainingSeconds: null, expired: false };
  }

  const startMs = parseServerTimestamp(startedAt);
  if (startMs == null) {
    return { hasTimer: true, totalSeconds: total, remainingSeconds: total, expired: false };
  }

  const elapsed = Math.max(0, Math.floor((nowMs - startMs) / 1000));
  const remaining = Math.max(0, total - elapsed);

  return {
    hasTimer: true,
    totalSeconds: total,
    remainingSeconds: remaining,
    expired: remaining <= 0,
  };
}

export function serializeArenaTimer(
  timerSeconds: number | null | undefined,
  startedAt: unknown,
  nowMs: number = Date.now(),
) {
  const state = computeArenaTimer(timerSeconds, startedAt, nowMs);
  return {
    ...state,
    serverNow: new Date(nowMs).toISOString(),
  };
}
