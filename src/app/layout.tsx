import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { LenisProvider } from "@/components/providers/LenisProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { TargetCursorWrapper } from "@/components/ui/TargetCursor";

// Static mapping to avoid next/font/google network failures during offline build
const fontDisplay = { variable: "font-display" };
const fontBody = { variable: "font-body" };
const fontStats = { variable: "font-stats" };
const fontMono = { variable: "font-mono" };
const fontLegacyDisplay = { variable: "font-legacy-display" };
const fontLegacyBody = { variable: "font-legacy-body" };



export const metadata: Metadata = {
  title: "Bountixx — Compete. Conquer. Collect.",
  description:
    "The AI-powered multiplayer challenge arena. Drop any challenge, lock the room, one winner claims the bounty.",
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#DDEAE1" },
    { media: "(prefers-color-scheme: dark)", color: "#120C0B" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider
      signInUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "/login"}
      signUpUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? "/signup"}
      signInFallbackRedirectUrl={
        process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL ?? "/dashboard"
      }
      signUpFallbackRedirectUrl={
        process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL ?? "/dashboard"
      }
      appearance={{ variables: { colorPrimary: "#F92313" } }}
    >
      <html
        lang="en"
        className={`${fontDisplay.variable} ${fontBody.variable} ${fontStats.variable} ${fontMono.variable} ${fontLegacyDisplay.variable} ${fontLegacyBody.variable} h-full`}
        suppressHydrationWarning
      >
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{var t=localStorage.getItem("bountixx-theme");if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t);document.documentElement.style.colorScheme=t}}catch(e){}})();`,
            }}
          />
        </head>
        <body className="min-h-full bg-cosmos text-haze overflow-x-hidden font-body antialiased">
          <AuthProvider>
            <ThemeProvider>
              <LenisProvider>
                <ToastProvider>
                  <TargetCursorWrapper />
                  {children}
                </ToastProvider>
              </LenisProvider>
            </ThemeProvider>
          </AuthProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
