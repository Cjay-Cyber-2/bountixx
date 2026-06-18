"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "cursor-target relative flex h-9 w-9 items-center justify-center rounded-full",
        "border border-[var(--border-2)] bg-[var(--surface-inset)]",
        "text-haze-2 transition-colors hover:text-haze hover:border-[var(--border-accent)]",
        className
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      <Sun
        size={16}
        className={cn(
          "absolute transition-all duration-300",
          isDark ? "scale-0 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"
        )}
        aria-hidden
      />
      <Moon
        size={16}
        className={cn(
          "absolute transition-all duration-300",
          isDark ? "scale-100 rotate-0 opacity-100" : "scale-0 -rotate-90 opacity-0"
        )}
        aria-hidden
      />
    </button>
  );
}
