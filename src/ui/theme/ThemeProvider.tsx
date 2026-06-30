import { createContext, useCallback, useMemo, useState, type ReactNode } from "react";
import { defaultThemeId, resolveTheme, themeRegistry } from "./themes";
import type { MobileTheme } from "./types";

export type ThemeContextValue = {
  theme: MobileTheme;
  themeId: string;
  availableThemes: MobileTheme[];
  setThemeId: (id: string) => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export type ThemeProviderProps = {
  children: ReactNode;
  initialThemeId?: string;
};

export function ThemeProvider({ children, initialThemeId }: ThemeProviderProps) {
  const [themeId, setThemeIdState] = useState(() => resolveTheme(initialThemeId).id);
  const setThemeId = useCallback((id: string) => {
    setThemeIdState(resolveTheme(id).id);
  }, []);
  const theme = useMemo(() => resolveTheme(themeId), [themeId]);
  const value = useMemo(
    () => ({
      theme,
      themeId,
      availableThemes: Object.values(themeRegistry),
      setThemeId
    }),
    [setThemeId, theme, themeId]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
