"use client";

import { auth } from "./firebase";

/**
 * Drop-in replacement for fetch() that attaches the current Firebase ID token
 * as Authorization: Bearer <token>. Use for all authenticated API calls.
 */
export async function fetchWithAuth(
  input: string | URL | Request,
  init?: RequestInit
): Promise<Response> {
  let token: string | null = null;
  try {
    token = (await auth.currentUser?.getIdToken()) ?? null;
  } catch {
    // proceed without token — server will fall back to session cookie
  }

  const headers = new Headers(init?.headers);
  headers.set("Content-Type", headers.get("Content-Type") ?? "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  return fetch(input, { ...init, headers });
}
