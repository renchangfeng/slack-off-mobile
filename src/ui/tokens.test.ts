import { describe, expect, it } from "vitest";
import {
  activityAccentForTone,
  activityToneColors,
  activeTheme,
  brandVoice,
  colors,
  spacing,
  uiThemes
} from "./tokens";

describe("ui tokens", () => {
  it("returns stable activity accents for known tones", () => {
    expect(activityAccentForTone("game")).toBe(activityToneColors.game);
    expect(activityAccentForTone("calm")).toBe(activityToneColors.calm);
  });

  it("falls back to the shared blue accent for unknown tones", () => {
    expect(activityAccentForTone("unknown")).toBe(colors.blue);
    expect(activityAccentForTone(null)).toBe(colors.blue);
  });

  it("keeps spacing scale compact for mobile controls", () => {
    expect(spacing.md).toBeGreaterThan(spacing.sm);
    expect(spacing.xxl).toBeLessThanOrEqual(32);
  });

  it("keeps the product voice available to UI previews", () => {
    expect(brandVoice.concept).toContain("休息");
    expect(brandVoice.motifs.length).toBeGreaterThanOrEqual(3);
  });

  it("exposes a complete active theme pack for future UI switching", () => {
    expect(activeTheme).toBe(uiThemes.pixelRest);
    expect(activeTheme.brandVoice.name).toBe("摸鱼证");
    expect(activeTheme.iconStyle).toBe("pseudo-pixel");
    expect(activeTheme.targetViewport.minWidth).toBeLessThanOrEqual(390);
    expect(activeTheme.borderStyle.pixelCornerSize).toBeGreaterThan(0);
  });
});
