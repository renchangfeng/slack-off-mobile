import { describe, expect, it } from "vitest";
import { deriveGameplayStep } from "./nextStep";

describe("deriveGameplayStep", () => {
  it("starts the loop with a check-in", () => {
    expect(
      deriveGameplayStep({
        hasActiveCheckIn: false,
        drawChances: 0,
        activityStatus: null,
        activityUnavailable: false,
        hasProgress: false
      }).kind
    ).toBe("start-checkin");
  });

  it("prioritizes finishing an active check-in", () => {
    expect(
      deriveGameplayStep({
        hasActiveCheckIn: true,
        drawChances: 2,
        activityStatus: "active",
        activityUnavailable: false,
        hasProgress: true
      }).kind
    ).toBe("finish-checkin");
  });

  it("prioritizes an available bean draw after check-in", () => {
    expect(
      deriveGameplayStep({
        hasActiveCheckIn: false,
        drawChances: 1,
        activityStatus: "active",
        activityUnavailable: false,
        hasProgress: true
      }).kind
    ).toBe("draw-bean");
  });

  it("guides the user to complete an active activity", () => {
    expect(
      deriveGameplayStep({
        hasActiveCheckIn: false,
        drawChances: 0,
        activityStatus: "active",
        activityUnavailable: false,
        hasProgress: true
      }).kind
    ).toBe("complete-activity");
  });

  it("guides a returning user toward another activity", () => {
    expect(
      deriveGameplayStep({
        hasActiveCheckIn: false,
        drawChances: 0,
        activityStatus: "completed",
        activityUnavailable: false,
        hasProgress: true
      }).kind
    ).toBe("get-activity");
  });

  it("stops promoting activities when the eligible pool is empty", () => {
    const step = deriveGameplayStep({
      hasActiveCheckIn: false,
      drawChances: 0,
      activityStatus: "completed",
      activityUnavailable: true,
      hasProgress: true
    });

    expect(step.kind).toBe("start-checkin");
    expect(step.title).toBe("任务池暂时休息了");
  });
});
