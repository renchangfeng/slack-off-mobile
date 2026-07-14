import { describe, expect, it } from "vitest";
import {
  calmOfficeTheme,
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
  expect(theme.colors.surfaceWarm).toBeTruthy();
  expect(theme.colors.text).toBeTruthy();
  expect(theme.colors.textMuted).toBeTruthy();
  expect(theme.colors.primary).toBeTruthy();
  expect(theme.colors.accent).toBeTruthy();
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
  expect(theme.status.active.bg).toBeTruthy();
  expect(theme.status.completed.bg).toBeTruthy();
  expect(theme.status.locked.bg).toBeTruthy();
  expect(theme.status.warning.bg).toBeTruthy();
  expect(theme.status.default.bg).toBeTruthy();
  expect(theme.art.iconStyle).toBeTruthy();
  expect(theme.art.placeholderStyle).toBeTruthy();
}

describe("theme registry", () => {
  it("registers at least two themes", () => {
    expect(listThemes().length).toBeGreaterThanOrEqual(2);
    expect(themeRegistry["pixel-rest"]).toBe(pixelRestTheme);
    expect(themeRegistry["calm-office"]).toBe(calmOfficeTheme);
  });

  it("keeps pixel-rest as the default theme", () => {
    expect(defaultThemeId).toBe("pixel-rest");
    expect(resolveTheme().id).toBe("pixel-rest");
    expect(resolveTheme(null).id).toBe("pixel-rest");
  });

  it("falls back to the default theme for unknown ids", () => {
    expect(resolveTheme("not-a-theme").id).toBe(defaultThemeId);
    expect(resolveTheme("").id).toBe(defaultThemeId);
  });

  it("requires every registered theme to define all required fields", () => {
    for (const theme of listThemes()) {
      assertCompleteTheme(theme);
    }
  });

  it("keeps the pixel-rest visual identity", () => {
    expect(pixelRestTheme.colors.background).toBe("#f4efe4");
    expect(pixelRestTheme.colors.primary).toBe("#116548");
    expect(pixelRestTheme.colors.accent).toBe("#b7f05a");
    expect(pixelRestTheme.art.iconStyle).toBe("pseudo-pixel");
  });

  it("gives calm-office a distinct low-noise direction", () => {
    expect(calmOfficeTheme.colors.background).not.toBe(pixelRestTheme.colors.background);
    expect(calmOfficeTheme.colors.primary).not.toBe(pixelRestTheme.colors.primary);
    expect(calmOfficeTheme.colors.accent).not.toBe(pixelRestTheme.colors.accent);
    expect(calmOfficeTheme.colors.surface).not.toBe(pixelRestTheme.colors.surface);
    expect(calmOfficeTheme.art.iconStyle).toBe("soft-office");
    expect(calmOfficeTheme.brand.appName).toBe("离线证");
  });

  it("keeps the product voice available to UI previews", () => {
    expect(pixelRestTheme.brand.manifestoTitle).toContain("休息");
    expect(pixelRestTheme.brand.manifestoCopy).toContain("开心一下");
    expect(calmOfficeTheme.brand.tagline).toContain("工位");
  });
});
