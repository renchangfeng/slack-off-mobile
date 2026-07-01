import { describe, expect, it } from "vitest";
import { reduceMotionPreferenceToIntensity } from "../reducedMotion";

describe("motion feedback", () => {
  it("treats enabled reduced motion as reduced intensity", () => {
    expect(reduceMotionPreferenceToIntensity(true)).toBe("reduced");
  });

  it("treats disabled or unavailable reduced motion as normal intensity", () => {
    expect(reduceMotionPreferenceToIntensity(false)).toBe("normal");
    expect(reduceMotionPreferenceToIntensity(null)).toBe("normal");
    expect(reduceMotionPreferenceToIntensity(undefined)).toBe("normal");
  });
});
