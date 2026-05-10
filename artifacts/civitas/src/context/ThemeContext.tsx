import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { ThemeName, ColorPalette } from "@/constants/colors";
import { THEMES } from "@/constants/colors";

interface ThemeContextType {
  themeName: ThemeName;
  colors: ColorPalette & { radius: number };
  cycleTheme: () => void;
  setTheme: (name: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const CYCLE_ORDER: ThemeName[] = ["dark", "light", "miamiVice"];

function applyThemeCssVars(colors: ColorPalette) {
  const root = document.documentElement.style;
  root.setProperty("--color-background", colors.background);
  root.setProperty("--color-foreground", colors.foreground);
  root.setProperty("--color-card", colors.card);
  root.setProperty("--color-primary", colors.primary);
  root.setProperty("--color-primary-foreground", colors.primaryForeground);
  root.setProperty("--color-secondary", colors.secondary);
  root.setProperty("--color-muted", colors.muted);
  root.setProperty("--color-muted-foreground", colors.mutedForeground);
  root.setProperty("--color-border", colors.border);
  root.setProperty("--color-destructive", colors.destructive);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeName, setThemeName] = useState<ThemeName>("dark");

  const cycleTheme = useCallback(() => {
    setThemeName((prev) => {
      const idx = CYCLE_ORDER.indexOf(prev);
      return CYCLE_ORDER[(idx + 1) % CYCLE_ORDER.length];
    });
  }, []);

  const setTheme = useCallback((name: ThemeName) => setThemeName(name), []);

  const colors = { ...THEMES[themeName], radius: 14 };

  useEffect(() => {
    applyThemeCssVars(colors);
  }, [themeName]);

  return (
    <ThemeContext.Provider value={{ themeName, colors, cycleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
