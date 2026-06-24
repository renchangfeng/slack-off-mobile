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

  it("keeps local urgent state above server hints", () => {
    const step = deriveGameplayStep({
      hasActiveCheckIn: false,
      drawChances: 1,
      activityStatus: null,
      activityUnavailable: false,
      hasProgress: true,
      serverNextActions: [
        {
          code: "claim_daily_reward",
          title: "领取奖励",
          description: "奖励可领",
          actionLabel: "领取",
          targetSection: "home",
          priority: 1,
          rewardPreview: { score: 15, drawProgress: 1, drawChances: 0 }
        }
      ]
    });

    expect(step.kind).toBe("draw-bean");
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

  it("uses server next actions when local runtime state is idle", () => {
    const step = deriveGameplayStep({
      hasActiveCheckIn: false,
      drawChances: 0,
      activityStatus: null,
      activityUnavailable: false,
      hasProgress: true,
      serverNextActions: [
        {
          code: "complete_activity",
          title: "补一个摸鱼任务",
          description: "今日目标还差一个活动",
          actionLabel: "去领任务",
          targetSection: "activities",
          priority: 25,
          rewardPreview: { score: 5, drawProgress: 1, drawChances: 0 }
        }
      ]
    });

    expect(step).toMatchObject({
      kind: "get-activity",
      targetSection: "activities",
      rewardPreview: { score: 5, drawProgress: 1, drawChances: 0 }
    });
  });

  it("maps claim reward hints to claim actions", () => {
    const step = deriveGameplayStep({
      hasActiveCheckIn: false,
      drawChances: 0,
      activityStatus: null,
      activityUnavailable: false,
      hasProgress: true,
      serverNextActions: [
        {
          code: "claim_daily_reward",
          title: "今日整组奖励可以领取",
          description: "今天闭环已完成",
          actionLabel: "领取今日奖励",
          targetSection: "home",
          priority: 10,
          rewardPreview: { score: 15, drawProgress: 1, drawChances: 0 }
        }
      ]
    });

    expect(step.kind).toBe("claim-daily-reward");
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
