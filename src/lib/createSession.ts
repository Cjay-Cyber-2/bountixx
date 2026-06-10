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
    console.log("[createSession] Getting ID token for user:", user.uid);
    const idToken = await user.getIdToken();
    console.log("[createSession] Got ID token, posting to /api/auth/session");
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
      signal: AbortSignal.timeout(12_000),
    });
    console.log("[createSession] Response status:", res.status, "ok:", res.ok);
    if (!res.ok) {
      const text = await res.text();
      console.error("[createSession] Session API failed:", text);
      return false;
    }
    // Wait for cookie to propagate to browser before continuing
    await new Promise((resolve) => setTimeout(resolve, 100));
    return true;
  } catch (err) {
    console.error("[createSession] Exception:", err);
    return false;
  }
}
