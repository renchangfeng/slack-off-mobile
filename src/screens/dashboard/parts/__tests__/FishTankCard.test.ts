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

import { calculateLiveCooldownSeconds, formatCooldown } from "../FishTankCard";

describe("FishTankCard formatCooldown", () => {
  it("returns feed label when cooldown is zero or negative", () => {
    expect(formatCooldown(0)).toBe("可投喂");
    expect(formatCooldown(-10)).toBe("可投喂");
  });

  it("formats minutes when under an hour", () => {
    expect(formatCooldown(59)).toBe("1 分钟后");
    expect(formatCooldown(25 * 60)).toBe("25 分钟后");
  });

  it("formats whole hours", () => {
    expect(formatCooldown(2 * 60 * 60)).toBe("2 小时");
  });

  it("formats hours and remaining minutes", () => {
    expect(formatCooldown(90 * 60)).toBe("1 小时 30 分");
    expect(formatCooldown(95 * 60)).toBe("1 小时 35 分");
  });
});

describe("FishTankCard calculateLiveCooldownSeconds", () => {
  it("counts down from nextAvailableAt", () => {
    const now = Date.parse("2026-07-08T06:00:00.000Z");

    expect(
      calculateLiveCooldownSeconds(
        {
          available: false,
          nextAvailableAt: "2026-07-08T06:02:00.000Z",
          cooldownRemainingSeconds: 999
        },
        now,
        now
      )
    ).toBe(120);

    expect(
      calculateLiveCooldownSeconds(
        {
          available: false,
          nextAvailableAt: "2026-07-08T06:02:00.000Z",
          cooldownRemainingSeconds: 999
        },
        now + 61_000,
        now
      )
    ).toBe(59);
  });

  it("falls back to received cooldown seconds when nextAvailableAt is missing", () => {
    const receivedAt = Date.parse("2026-07-08T06:00:00.000Z");

    expect(
      calculateLiveCooldownSeconds(
        {
          available: false,
          nextAvailableAt: null,
          cooldownRemainingSeconds: 90
        },
        receivedAt + 31_000,
        receivedAt
      )
    ).toBe(59);
  });

  it("becomes available when cooldown reaches zero", () => {
    const now = Date.parse("2026-07-08T06:00:00.000Z");

    expect(
      calculateLiveCooldownSeconds(
        {
          available: false,
          nextAvailableAt: "2026-07-08T05:59:59.000Z",
          cooldownRemainingSeconds: 1
        },
        now,
        now
      )
    ).toBe(0);
  });
});
