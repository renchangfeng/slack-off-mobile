import { describe, expect, it } from "vitest";
import {
  defaultThemeId,
  listThemes,
  pixelRestTheme,
  resolveTheme,
  themeRegistry
} from "../themes";
import type { MobileTheme } from "../types";

function assertCompleteTheme(theme: MobileTheme) {
  expect(theme.id).toBeTruthy();
  expect(theme.name).toBeTruthy();
  expect(theme.brand.appName).toBeTruthy();
  expect(theme.colors.background).toBeTruthy();
  expect(theme.colors.surface).toBeTruthy();
  expect(theme.colors.surfaceMuted).toBeTruthy();
  expect(theme.colors.text).toBeTruthy();
  expect(theme.colors.textMuted).toBeTruthy();
  expect(theme.colors.primary).toBeTruthy();
  expect(theme.colors.border).toBeTruthy();
  expect(theme.colors.danger).toBeTruthy();
  expect(theme.colors.warning).toBeTruthy();
  expect(theme.colors.success).toBeTruthy();
  expect(theme.spacing.xs).toBeGreaterThanOrEqual(0);
  expect(theme.spacing.sm).toBeGreaterThan(theme.spacing.xs);
  expect(theme.spacing.md).toBeGreaterThan(theme.spacing.sm);
  expect(theme.spacing.lg).toBeGreaterThan(theme.spacing.md);
  expect(theme.spacing.xl).toBeGreaterThan(theme.spacing.lg);
  expect(theme.radius.sm).toBeGreaterThan(0);
  expect(theme.radius.md).toBeGreaterThanOrEqual(theme.radius.sm);
  expect(theme.radius.lg).toBeGreaterThanOrEqual(theme.radius.md);
  expect(theme.borders.cardWidth).toBeGreaterThanOrEqual(0);
  expect(theme.borders.strongWidth).toBeGreaterThanOrEqual(theme.borders.cardWidth);
  expect(theme.typography.displayFamilyHint).toBeTruthy();
  expect(theme.typography.bodyFamilyHint).toBeTruthy();
  expect(Object.keys(theme.gameplay.activityAccents).length).toBeGreaterThan(0);
  expect(Object.keys(theme.gameplay.rarityAccents).length).toBeGreaterThan(0);
  expect(theme.art.iconStyle).toBeTruthy();
  expect(theme.art.placeholderStyle).toBeTruthy();
}

describe("theme registry", () => {
  it("registers the default pixel-rest theme", () => {
    expect(themeRegistry[defaultThemeId]).toBe(pixelRestTheme);
    expect(pixelRestTheme.brand.appName).toBe("摸鱼证");
    expect(pixelRestTheme.brand.manifestoTitle).toContain("休息");
    expect(pixelRestTheme.brand.manifestoCopy).toContain("开心一下");
  });

  it("lists all registered themes", () => {
    const themes = listThemes();
    expect(themes.length).toBeGreaterThan(0);
    expect(themes.some((t) => t.id === defaultThemeId)).toBe(true);
  });

  it("requires every registered theme to define all required fields", () => {
    for (const theme of listThemes()) {
      assertCompleteTheme(theme);
    }
  });

  it("falls back to the default theme for unknown ids", () => {
    expect(resolveTheme("not-a-theme").id).toBe(defaultThemeId);
    expect(resolveTheme("").id).toBe(defaultThemeId);
    expect(resolveTheme(null).id).toBe(defaultThemeId);
  });

  it("preserves the pixel-rest visual identity", () => {
    expect(pixelRestTheme.colors.background).toBe("#f4efe4");
    expect(pixelRestTheme.colors.primary).toBe("#17a36b");
    expect(pixelRestTheme.art.iconStyle).toBe("pseudo-pixel");
  });
});
