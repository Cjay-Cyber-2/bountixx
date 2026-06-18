import type { Metadata } from "next";
import {
  Instrument_Serif,
  Plus_Jakarta_Sans,
  DM_Mono,
  Tourney,
  Chakra_Petch,
} from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { LenisProvider } from "@/components/providers/LenisProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { TargetCursorWrapper } from "@/components/ui/TargetCursor";

/** App display headings — editorial serif */
const fontDisplay = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

/** Body copy — clean geometric sans */
const fontBody = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/** Stats & numerals */
const fontStats = Plus_Jakarta_Sans({
  variable: "--font-stats",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

/** Labels & code */
const fontMono = DM_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

/** Legacy hero fonts (scoped via data-legacy-aesthetic) */
const fontLegacyDisplay = Tourney({
  variable: "--font-legacy-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const fontLegacyBody = Chakra_Petch({
  variable: "--font-legacy-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bountixx — Compete. Conquer. Collect.",
  description:
    "The AI-powered multiplayer challenge arena. Drop any challenge, lock the room, one winner claims the bounty.",
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#DDEAE1" },
    { media: "(prefers-color-scheme: dark)", color: "#0C080A" },
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
      signInForceRedirectUrl={
        process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL ?? "/dashboard"
      }
      signUpForceRedirectUrl={
        process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL ?? "/dashboard"
      }
      appearance={{ variables: { colorPrimary: "#5C0A46" } }}
    >
      <html
        lang="en"
        className={`${fontDisplay.variable} ${fontBody.variable} ${fontStats.variable} ${fontMono.variable} ${fontLegacyDisplay.variable} ${fontLegacyBody.variable} h-full`}
        suppressHydrationWarning
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
