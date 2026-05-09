import React, { createContext, useContext, useState, useCallback } from "react";
import { ThemeName, THEMES, ColorPalette } from "@/constants/colors";

interface ThemeContextType {
  themeName: ThemeName;
  colors: ColorPalette & { radius: number };
  cycleTheme: () => void;
  setTheme: (name: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const CYCLE_ORDER: ThemeName[] = ["dark", "light", "miamiVice"];

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
