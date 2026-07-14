import { describe, expect, it } from "vitest";
import { resolveCoreSurfaceLayout } from "../coreSurfaceLayout";

describe("resolveCoreSurfaceLayout", () => {
  it("classifies 360px as narrow", () => {
    expect(resolveCoreSurfaceLayout(360, { comfortable: 390, wide: 640 })).toEqual({
      isNarrow: true,
      isComfortable: false,
      isWide: false
    });
  });

  it("classifies 390px as comfortable", () => {
    expect(resolveCoreSurfaceLayout(390, { comfortable: 390, wide: 640 })).toEqual({
      isNarrow: false,
      isComfortable: true,
      isWide: false
    });
  });

  it("classifies 640px as wide", () => {
    expect(resolveCoreSurfaceLayout(640, { comfortable: 390, wide: 640 })).toEqual({
      isNarrow: false,
      isComfortable: false,
      isWide: true
    });
  });

  it("uses the active theme viewport thresholds by default", () => {
    const result = resolveCoreSurfaceLayout(360);
    expect(result.isNarrow).toBe(true);
    expect(result.isComfortable).toBe(false);
    expect(result.isWide).toBe(false);
  });
});
