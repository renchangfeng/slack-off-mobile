import { describe, expect, it, vi } from "vitest";

vi.mock("react-native", () => ({
  Animated: {
    Value: class {
      setValue() {}
    },
    timing: () => ({ start: () => {} }),
    spring: () => ({ start: () => {} }),
    parallel: () => ({ start: () => {} })
  }
}));

import { reduceMotionPreferenceToIntensity } from "../reducedMotion";
import { MOTION_CONFIGS } from "../MotionFeedback";

describe("motion feedback", () => {
  it("treats enabled reduced motion as reduced intensity", () => {
    expect(reduceMotionPreferenceToIntensity(true)).toBe("reduced");
  });

  it("treats disabled or unavailable reduced motion as normal intensity", () => {
    expect(reduceMotionPreferenceToIntensity(false)).toBe("normal");
    expect(reduceMotionPreferenceToIntensity(null)).toBe("normal");
    expect(reduceMotionPreferenceToIntensity(undefined)).toBe("normal");
  });

  it("defines a config for every motion feedback variant", () => {
    const variants = [
      "check-in",
      "activity-step",
      "activity-complete",
      "bean-reveal",
      "achievement-unlock",
      "theme-switch",
      "fish-feed",
      "fish-hatch",
      "decor-equip"
    ] as const;
    for (const variant of variants) {
      const config = MOTION_CONFIGS[variant];
      expect(config).toBeDefined();
      expect(config.duration).toBeGreaterThan(0);
      expect(config.initial.opacity).toBeDefined();
      expect(config.final.opacity).toBeDefined();
    }
  });
});
