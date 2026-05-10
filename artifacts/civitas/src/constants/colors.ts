export type ThemeName = "dark" | "light" | "miamiVice";

export interface ColorPalette {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  crime: string;
  requests311: string;
  permits: string;
  water: string;
  cargo: string;
}

const dark: ColorPalette = {
  background:            "#0A1628",
  foreground:            "#F0F4FF",
  card:                  "#162038",
  cardForeground:        "#F0F4FF",
  primary:               "#00B4D8",
  primaryForeground:     "#0A1628",
  secondary:             "#1E2E4A",
  secondaryForeground:   "#F0F4FF",
  muted:                 "#243355",
  mutedForeground:       "#8B9DC3",
  accent:                "#FF6B6B",
  accentForeground:      "#FFFFFF",
  destructive:           "#FF453A",
  destructiveForeground: "#FFFFFF",
  border:                "#2A3D5E",
  input:                 "#1E2E4A",
  crime:                 "#FF453A",
  requests311:           "#FFD60A",
  permits:               "#32D74B",
  water:                 "#4FC3F7",
  cargo:                 "#FF9500",
};

const light: ColorPalette = {
  background:            "#F0F6FF",
  foreground:            "#0A1628",
  card:                  "#FFFFFF",
  cardForeground:        "#0A1628",
  primary:               "#0077B6",
  primaryForeground:     "#FFFFFF",
  secondary:             "#E8F0FA",
  secondaryForeground:   "#0A1628",
  muted:                 "#DDE8F4",
  mutedForeground:       "#5A7290",
  accent:                "#E63946",
  accentForeground:      "#FFFFFF",
  destructive:           "#E63946",
  destructiveForeground: "#FFFFFF",
  border:                "#C0D4E8",
  input:                 "#E8F0FA",
  crime:                 "#E63946",
  requests311:           "#F0A000",
  permits:               "#1E8A3C",
  water:                 "#0077B6",
  cargo:                 "#D4700A",
};

const miamiVice: ColorPalette = {
  background:            "#0D0D1A",
  foreground:            "#F8F4FF",
  card:                  "#1A1035",
  cardForeground:        "#F8F4FF",
  primary:               "#FF2D78",
  primaryForeground:     "#FFFFFF",
  secondary:             "#1A0F2E",
  secondaryForeground:   "#F8F4FF",
  muted:                 "#2A1848",
  mutedForeground:       "#9B8AB8",
  accent:                "#00FFD1",
  accentForeground:      "#0D0D1A",
  destructive:           "#FF2D78",
  destructiveForeground: "#FFFFFF",
  border:                "#2E1E4A",
  input:                 "#1A0F2E",
  crime:                 "#FF2D78",
  requests311:           "#FFD60A",
  permits:               "#00FFD1",
  water:                 "#4FC3F7",
  cargo:                 "#FF9500",
};

export const THEMES: Record<ThemeName, ColorPalette> = { dark, light, miamiVice };

export const THEME_META: Record<ThemeName, { label: string; icon: string }> = {
  dark:      { label: "Dark",       icon: "🌙" },
  light:     { label: "Light",      icon: "☀️" },
  miamiVice: { label: "Miami Vice", icon: "✨" },
};
