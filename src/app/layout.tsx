import type { Metadata } from "next";
import { Orbitron, Rajdhani, Space_Mono, Zen_Dots, Nunito } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { LenisProvider } from "@/components/providers/LenisProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { TargetCursorWrapper } from "@/components/ui/TargetCursor";

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  display: "swap",
});

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const zenDots = Zen_Dots({
  variable: "--font-zen-dots",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bountixx — Compete. Conquer. Collect.",
  description:
    "The AI-powered multiplayer challenge arena. Drop any challenge, lock the room, one winner claims the bounty.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export const viewport = {
  themeColor: "#0E0818",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${orbitron.variable} ${rajdhani.variable} ${spaceMono.variable} ${zenDots.variable} ${nunito.variable} h-full`}
    >
      <body className="min-h-full bg-cosmos text-haze overflow-x-hidden">
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
  );
}
