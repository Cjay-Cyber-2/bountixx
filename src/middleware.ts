import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Public routes — never send these to Clerk's hosted Account Portal.
const isPublicRoute = createRouteMatcher([
  "/",
  "/login(.*)",
  "/signup(.*)",
  "/sso-callback(.*)",
  "/api/health(.*)",
  "/api/payment/stripe/webhook(.*)",
]);

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
]);

// Clerk is validated on the Edge middleware runtime. Next.js 16 proxy.ts (Node)
// does not propagate Clerk auth headers to route handlers reliably.
export default clerkMiddleware(async (auth, req) => {
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
