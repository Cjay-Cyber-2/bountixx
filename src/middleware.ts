import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Public routes — never send these to Clerk's hosted Account Portal.
const isPublicRoute = createRouteMatcher([
  "/",
  "/login(.*)",
  "/signup(.*)",
  "/sso-callback(.*)",
  "/api/health(.*)",
  "/api/presence/count(.*)",
  "/api/payment/stripe/webhook(.*)",
]);

const isAuthPage = createRouteMatcher(["/login(.*)", "/signup(.*)"]);

// App pages that require a signed-in user. API routes are intentionally NOT
// listed here — they call getSession() / requireClerkAuth() and return 401 JSON.
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/create(.*)",
  "/arena(.*)",
  "/lobby(.*)",
  "/wallet(.*)",
  "/profile(.*)",
  "/payment(.*)",
  "/join(.*)",
]);

// Clerk is validated on the Edge middleware runtime. Next.js 16 proxy.ts (Node)
// does not propagate Clerk auth headers to route handlers reliably.
export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  if (userId && isAuthPage(req)) {
    const next = req.nextUrl.searchParams.get("next");
    const dest = next && next.startsWith("/") ? next : "/dashboard";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  if (!isPublicRoute(req) && isProtectedRoute(req)) {
    const loginUrl = new URL("/login", req.url);
    const returnPath = `${req.nextUrl.pathname}${req.nextUrl.search}`;
    if (returnPath && returnPath !== "/login") {
      loginUrl.searchParams.set("next", returnPath);
    }
    await auth.protect({
      unauthenticatedUrl: loginUrl.toString(),
    });
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
