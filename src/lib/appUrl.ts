/**
 * Canonical app origin for invite links, OAuth, and QR codes.
 * Prefer NEXT_PUBLIC_APP_URL in production so shared links always point at
 * bountixx.vercel.app (not a preview deployment hostname).
 */
export function getAppOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "http://localhost:3000";
}

export function buildInviteLink(roomId: string, origin?: string): string {
  const base = (origin ?? getAppOrigin()).replace(/\/$/, "");
  return `${base}/join/${roomId}`;
}
