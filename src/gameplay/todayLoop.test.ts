import { describe, expect, it } from "vitest";
import { deriveTodayPlayLoop } from "./todayLoop";
import type { AchievementList, AchievementRecommendation } from "../api/achievements";
import type { ProgressionSummary } from "../api/progression";

const now = "2026-07-02T00:00:00.000Z";

function activeSession() {
  return {
    id: "session",
    status: "active" as const,
    startedAt: now,
    endedAt: null,
    durationSeconds: null,
    eligibleDurationSeconds: null,
    rewarded: false
  };
}

function goal(code: "check_in" | "activity" | "bean_draw", completed = false) {
  return {
    code,
    title: code,
    description: `${code} goal`,
    current: completed ? 1 : 0,
    target: 1,
    unit: "times" as const,
    completed
  };
}

function progression(overrides: Partial<ProgressionSummary> = {}): ProgressionSummary {
  const dailyGoals = {
    period: "daily" as const,
    periodStart: now,
    periodEnd: now,
    completed: 0,
    total: 3,
    allCompleted: false,
    rewardClaimed: false,
    claimedAt: null,
    reward: { score: 12, drawProgress: 1 },
    goals: [goal("check_in"), goal("activity"), goal("bean_draw")]
  };
  return {
    level: 1,
    experience: 0,
    currentLevelExperience: 0,
    nextLevelExperience: 100,
    progressPercent: 0,
    currentStreakDays: 0,
    longestStreakDays: 0,
    lifetime: {
      totalSessions: 0,
      eligibleRestMinutes: 0,
      completedActivities: 0,
      collectedBeanTypes: 0,
      unlockedAchievements: 0
    },
    dailyGoals,
    weeklyGoals: { ...dailyGoals, period: "weekly" as const, reward: { score: 30, drawProgress: 2 } },
    nextActions: [],
    ...overrides
  };
}

function achievement(id: string, group: AchievementRecommendation["recommendationGroup"]): AchievementRecommendation {
  return {
    id,
    code: id,
    name: `成就 ${id}`,
    description: "achievement",
    ruleType: "activity_count",
    rewardConfig: {},
    progress: { current: 4, target: 5, unit: "count", percent: 80, completed: false },
    category: "activity",
    rarity: "common",
    unlockSummary: "快了",
    recommendationWeight: 1,
    todayFriendly: group === "today",
    actionHint: { section: "activities", label: "去活动" },
    unlockedAt: null,
    rewardClaimedAt: null,
    recommendationGroup: group,
    recommendationReason: "马上完成",
    remainingEffortLabel: "还差 1 次",
    targetSection: "activities"
  };
}

function achievements(): AchievementList {
  const today = achievement("today", "today");
  const nearest = achievement("nearest", "nearest");
  return {
    achievements: [today, nearest],
    recommendations: { today: [today], nearest: [nearest], long_term: [] }
  };
}

describe("deriveTodayPlayLoop", () => {
  it("prioritizes finishing an active check-in", () => {
    const vm = deriveTodayPlayLoop({
      activeSession: activeSession(),
      lastResult: null,
      activityAssignment: { status: "active" } as never,
      activityResult: null,
      beanCollection: { drawChances: 2 } as never,
      beanDrawResult: null,
      progression: progression(),
      achievementList: achievements(),
      activityUnavailable: false
    });

    expect(vm.primaryNextAction?.kind).toBe("check-in");
    expect(vm.routeSteps[0].status).toBe("active");
  });

  it("starts with check-in before existing draw chances when today's check-in is incomplete", () => {
    const vm = deriveTodayPlayLoop({
      activeSession: null,
      lastResult: null,
      activityAssignment: null,
      activityResult: null,
      beanCollection: { drawChances: 1 } as never,
      beanDrawResult: null,
      progression: progression(),
      achievementList: achievements(),
      activityUnavailable: false
    });

    expect(vm.primaryNextAction?.kind).toBe("check-in");
    expect(vm.secondaryActions.map((action) => action.kind)).toContain("bean-draw");
  });

  it("promotes active activity after today's check-in is complete", () => {
    const vm = deriveTodayPlayLoop({
      activeSession: null,
      lastResult: null,
      activityAssignment: { status: "active" } as never,
      activityResult: null,
      beanCollection: { drawChances: 0 } as never,
      beanDrawResult: null,
      progression: progression({
        dailyGoals: {
          ...progression().dailyGoals,
          goals: [goal("check_in", true), goal("activity"), goal("bean_draw")]
        }
      }),
      achievementList: null,
      activityUnavailable: false
    });

    expect(vm.primaryNextAction?.kind).toBe("activity");
  });

  it("uses activity result draw chance as result follow-up", () => {
    const vm = deriveTodayPlayLoop({
      activeSession: null,
      lastResult: null,
      activityAssignment: { status: "completed" } as never,
      activityResult: { reward: { drawChancesGranted: 1 } } as never,
      beanCollection: { drawChances: 1 } as never,
      beanDrawResult: null,
      progression: progression({
        dailyGoals: {
          ...progression().dailyGoals,
          goals: [goal("check_in", true), goal("activity", true), goal("bean_draw")]
        }
      }),
      achievementList: achievements(),
      activityUnavailable: false
    });

    expect(vm.primaryNextAction?.kind).toBe("bean-draw");
    expect(vm.resultFollowUps.primary?.kind).toBe("bean-draw");
    expect(vm.drawChanceSource).toBe("activity");
  });

  it("surfaces claimable goal rewards before achievements", () => {
    const base = progression();
    const vm = deriveTodayPlayLoop({
      activeSession: null,
      lastResult: null,
      activityAssignment: null,
      activityResult: null,
      beanCollection: { drawChances: 0 } as never,
      beanDrawResult: null,
      progression: progression({
        dailyGoals: {
          ...base.dailyGoals,
          allCompleted: true,
          rewardClaimed: false,
          goals: [goal("check_in", true), goal("activity", true), goal("bean_draw", true)]
        }
      }),
      achievementList: achievements(),
      activityUnavailable: false
    });

    expect(vm.primaryNextAction?.kind).toBe("goal-reward");
    expect(vm.primaryNextAction?.rewardPreview).toEqual({ score: 12, drawProgress: 1, drawChances: 0 });
  });
});
