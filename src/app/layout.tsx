import type { Metadata } from "next";
import { Tourney, Chakra_Petch, Oxanium, Share_Tech_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { LenisProvider } from "@/components/providers/LenisProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { TargetCursorWrapper } from "@/components/ui/TargetCursor";

/** Arena display — tournament poster energy for heroes & section titles */
const fontDisplay = Tourney({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

/** Body copy — angular tech-gaming sans, readable but unmistakable */
const fontBody = Chakra_Petch({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

/** Stats, scores, coin counts — esports HUD numerals */
const fontStats = Oxanium({
  variable: "--font-stats",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

/** Labels, eyebrows, terminal chrome */
const fontMono = Share_Tech_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bountixx — Compete. Conquer. Collect.",
  description:
    "The AI-powered multiplayer challenge arena. Drop any challenge, lock the room, one winner claims the bounty.",
};

export const viewport = {
  themeColor: "#0E0818",
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
      signInForceRedirectUrl={
        process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL ?? "/dashboard"
      }
      signUpForceRedirectUrl={
        process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL ?? "/dashboard"
      }
      appearance={{ variables: { colorPrimary: "#a855f7" } }}
    >
      <html
        lang="en"
        className={`${fontDisplay.variable} ${fontBody.variable} ${fontStats.variable} ${fontMono.variable} h-full`}
      >
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
