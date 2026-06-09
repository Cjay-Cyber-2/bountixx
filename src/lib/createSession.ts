import { User } from "firebase/auth";

/**
 * Gets a fresh ID token from the Firebase user, POSTs it to /api/auth/session
 * to set the __session httpOnly cookie, and returns whether it succeeded.
 *
 * This must be called and awaited BEFORE router.replace("/dashboard") so the
 * middleware cookie check passes.
 */
export async function createSession(user: User): Promise<boolean> {
  try {
    // No forceRefresh — the token from signInWithPopup/signInWithEmailAndPassword
    // is already fresh. Forcing a refresh makes a redundant network round-trip to
    // Firebase's token endpoint which hangs the UI for several seconds.
    const idToken = await user.getIdToken();
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
      signal: AbortSignal.timeout(12_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
