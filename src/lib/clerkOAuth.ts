/** Absolute OAuth URLs — Clerk requires full URLs in production redirects. */
export function clerkOAuthUrls() {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");

  return {
    ssoCallback: `${origin}/sso-callback`,
    continueSignUp: `${origin}/signup/continue`,
    destination(path: string) {
      const next = path.startsWith("/") ? path : "/dashboard";
      return `${origin}${next}`;
    },
  };
}

export function readNextParam(): string {
  if (typeof window === "undefined") return "/dashboard";
  const params = new URLSearchParams(window.location.search);
  const next = params.get("redirect_url") ?? params.get("next");
  return next && next.startsWith("/") ? next : "/dashboard";
}
