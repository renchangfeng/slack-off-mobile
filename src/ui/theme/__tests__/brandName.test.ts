import { describe, expect, it } from "vitest";
import { resolveBrandName } from "../../useBrandName";
import { pixelRestTheme } from "../themes";
import type { MobileTheme } from "../types";

describe("brand display name", () => {
  it("uses the active theme appName when available", () => {
    expect(resolveBrandName(pixelRestTheme)).toBe("摸鱼证");
  });

  it("falls back to the technical product name when theme appName is empty", () => {
    const emptyBrandTheme: MobileTheme = {
      ...pixelRestTheme,
      id: "empty-brand",
      brand: { appName: "" }
    };
    expect(resolveBrandName(emptyBrandTheme)).toBe("Slack Off");
  });
});
