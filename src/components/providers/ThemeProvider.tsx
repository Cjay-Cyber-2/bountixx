"use client";
import { createContext, useContext, useEffect } from "react";

const ThemeCtx = createContext<{ theme: "dark" }>({ theme: "dark" });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
    localStorage.setItem("bountixx-theme", "dark");
  }, []);

  return <ThemeCtx.Provider value={{ theme: "dark" }}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);
