import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// App pages that require a signed-in user. API routes are intentionally NOT
// listed here — they call getSession() and return a proper 401 JSON response.
const isProtected = createRouteMatcher([
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
  if (isProtected(req)) {
    await auth.protect({
      unauthenticatedUrl: new URL("/login", req.url).toString(),
    });
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
