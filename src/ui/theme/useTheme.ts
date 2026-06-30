import { useContext } from "react";
import { ThemeContext } from "./ThemeProvider";
import { pixelRestTheme } from "./themes";
import type { MobileTheme } from "./types";

export function useTheme(): MobileTheme {
  const ctx = useContext(ThemeContext);
  if (!ctx) return pixelRestTheme;
  return ctx.theme;
}

export function useThemeSwitcher(): {
  theme: MobileTheme;
  themeId: string;
  availableThemes: MobileTheme[];
  setThemeId: (id: string) => void;
} {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: pixelRestTheme,
      themeId: pixelRestTheme.id,
      availableThemes: [pixelRestTheme],
      setThemeId: () => undefined
    };
  }
  return {
    theme: ctx.theme,
    themeId: ctx.themeId,
    availableThemes: ctx.availableThemes,
    setThemeId: ctx.setThemeId
  };
}
