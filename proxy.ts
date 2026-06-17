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
// listed here — they call getSession() and return a proper 401 JSON response.
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/create(.*)",
  "/arena(.*)",
  "/lobby(.*)",
  "/wallet(.*)",
  "/profile(.*)",
  "/join(.*)",
  "/payment(.*)",
]);

export const proxy = clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return;
  if (!isProtectedRoute(req)) return;

  // unauthenticatedUrl MUST stay on our domain. Clerk only honours custom
  // sign-in paths when NEXT_PUBLIC_CLERK_SIGN_IN_URL is set in the environment.
  await auth.protect({
    unauthenticatedUrl: new URL("/login", req.url).toString(),
  });
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
