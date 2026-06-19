/** Absolute OAuth URLs — Clerk requires full URLs in production redirects. */
export function clerkOAuthUrls(nextParam?: string) {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");

  const nextVal = nextParam || readNextParam();
  const nextQs = nextVal && nextVal !== "/dashboard" ? `?next=${encodeURIComponent(nextVal)}` : "";

  return {
    ssoCallback: `${origin}/sso-callback${nextQs}`,
    continueSignUp: `${origin}/signup/continue${nextQs}`,
    destination(path: string) {
      const target = path.startsWith("/") ? path : "/dashboard";
      return `${origin}${target}`;
    },
  };
}

export function readNextParam(): string {
  if (typeof window === "undefined") return "/dashboard";
  const params = new URLSearchParams(window.location.search);
  const next = params.get("redirect_url") ?? params.get("next");
  return next && next.startsWith("/") ? next : "/dashboard";
}

