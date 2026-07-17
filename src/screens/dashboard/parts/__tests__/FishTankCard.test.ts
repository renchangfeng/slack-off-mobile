import { describe, expect, it, vi } from "vitest";

vi.mock("react-native", () => ({
  View: "View",
  Text: "Text",
  Pressable: "Pressable",
  Animated: {
    Value: class {
      setValue() {}
    },
    timing: () => ({ start: () => {} }),
    spring: () => ({ start: () => {} }),
    parallel: () => ({ start: () => {} })
  },
  StyleSheet: { create: (s: unknown) => s as Record<string, unknown> }
}));

import {
  calculateLiveCooldownSecondsFromValues,
  formatCooldownCompact
} from "../fishTankHelpers";

describe("FishTankCard formatCooldown", () => {
  it("returns ready label when cooldown is zero or negative", () => {
    expect(formatCooldownCompact(0)).toBe("即可");
    expect(formatCooldownCompact(-10)).toBe("即可");
  });

  it("formats seconds when under a minute", () => {
    expect(formatCooldownCompact(59)).toBe("59 秒");
  });

  it("formats minutes when under an hour", () => {
    expect(formatCooldownCompact(60)).toBe("1 分");
    expect(formatCooldownCompact(25 * 60)).toBe("25 分");
  });

  it("formats whole hours", () => {
    expect(formatCooldownCompact(2 * 60 * 60)).toBe("2 时");
  });

  it("formats hours and remaining minutes", () => {
    expect(formatCooldownCompact(90 * 60)).toBe("1 时 30 分");
    expect(formatCooldownCompact(95 * 60)).toBe("1 时 35 分");
  });
});

describe("FishTankCard calculateLiveCooldownSeconds", () => {
  it("counts down from stored cooldown seconds", () => {
    const now = Date.parse("2026-07-08T06:00:00.000Z");

    expect(calculateLiveCooldownSecondsFromValues(120, now, now)).toBe(120);
    expect(calculateLiveCooldownSecondsFromValues(120, now + 61_000, now)).toBe(59);
  });

  it("becomes available when cooldown reaches zero", () => {
    const now = Date.parse("2026-07-08T06:00:00.000Z");

    expect(calculateLiveCooldownSecondsFromValues(1, now, now)).toBe(1);
    expect(calculateLiveCooldownSecondsFromValues(1, now + 2_000, now)).toBe(0);
  });
});
