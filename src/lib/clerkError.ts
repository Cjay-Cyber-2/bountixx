type ClerkErr = {
  errors?: { code?: string; longMessage?: string; message?: string }[];
  message?: string;
};

export function isSessionExistsError(err: unknown): boolean {
  const e = err as ClerkErr;
  const code = e?.errors?.[0]?.code;
  const msg = (e?.errors?.[0]?.longMessage ?? e?.errors?.[0]?.message ?? e?.message ?? "").toLowerCase();
  return code === "session_exists" || msg.includes("already signed in") || msg.includes("already logged in");
}

export function clerkError(err: unknown): string {
  const e = err as ClerkErr;
  return e?.errors?.[0]?.longMessage ?? e?.errors?.[0]?.message ?? e?.message ?? "Something went wrong. Please try again.";
}
