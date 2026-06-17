"use client";

/**
 * Drop-in replacement for fetch() for authenticated API calls.
 *
 * With Clerk, the session is carried by an httpOnly cookie that the browser
 * sends automatically on same-origin requests, so no Authorization header is
 * needed. We force `no-store` so per-user responses (profile, balance, etc.)
 * are never served from a stale cache for a different signed-in user.
 */
export async function fetchWithAuth(
  input: string | URL | Request,
  init?: RequestInit
): Promise<Response> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(input, { ...init, headers, cache: "no-store", credentials: "include" });
}
