import { describe, expect, it } from "vitest";
import { deriveHomeSurface, type HomeSurface } from "../homeSurface";
import type { HomeTabProps } from "../types";
import type { CheckInFinishResult, CheckInSession } from "../../../api/checkins";
import type { ProgressionClaimResult, ProgressionSummary } from "../../../api/progression";
import type { TodayLoopViewModel } from "../../../gameplay/todayLoop";
import type { DerivedGameplayStep } from "../types";

function baseProgression(overrides?: Partial<ProgressionSummary>): ProgressionSummary {
  return {
    level: 3,
    experience: 120,
    currentLevelExperience: 20,
    nextLevelExperience: 100,
    progressPercent: 20,
    currentStreakDays: 5,
    longestStreakDays: 12,
    lifetime: {
      totalSessions: 10,
      eligibleRestMinutes: 120,
      completedActivities: 4,
      collectedBeanTypes: 6,
      unlockedAchievements: 2
    },
    dailyGoals: {
      period: "daily",
      periodStart: "2026-07-13T00:00:00Z",
      periodEnd: "2026-07-13T23:59:59Z",
      completed: 1,
      total: 3,
      allCompleted: false,
      rewardClaimed: false,
      claimedAt: null,
      reward: { score: 10, drawProgress: 2 },
      goals: [
        {
          code: "check_in",
          title: "休息一次",
          description: "完成一次带薪休息",
          current: 1,
          target: 1,
          unit: "times",
          completed: true
        },
        {
          code: "activity",
          title: "做任务",
          description: "完成一次摸鱼任务",
          current: 0,
          target: 1,
          unit: "times",
          completed: false
        },
        {
          code: "bean_draw",
          title: "抽豆",
          description: "抽一次豆",
          current: 0,
          target: 1,
          unit: "times",
          completed: false
        }
      ]
    },
    weeklyGoals: {
      period: "weekly",
      periodStart: "2026-07-13T00:00:00Z",
      periodEnd: "2026-07-19T23:59:59Z",
      completed: 3,
      total: 3,
      allCompleted: true,
      rewardClaimed: true,
      claimedAt: "2026-07-13T10:00:00Z",
      reward: { score: 30, drawProgress: 5 },
      goals: []
    },
    nextActions: [],
    ...overrides
  } as ProgressionSummary;
}

function baseTodayLoop(overrides?: Partial<TodayLoopViewModel>): TodayLoopViewModel {
  return {
    routeSteps: [],
    primaryNextAction: null,
    secondaryActions: [],
    todayObjectives: [],
    loopMessage: "今日路线测试",
    routeProgress: {
      completedCoreSteps: 1,
      totalCoreSteps: 4,
      percent: 25,
      progressLabel: "1/4",
      stageLabel: "当前：休息一次"
    },
    routeDelight: {
      mood: "in-progress",
      title: "正在推进今日路线",
      copy: "测试中",
      doneForToday: false
    },
    resultDelight: null,
    resultFollowUps: { primary: null, secondary: [] },
    drawChanceSource: null,
    ...overrides
  } as TodayLoopViewModel;
}

function baseNextStep(overrides?: Partial<DerivedGameplayStep>): DerivedGameplayStep {
  return {
    kind: "get-activity",
    title: "领取摸鱼任务",
    description: "完成随机摸鱼任务",
    actionLabel: "领取任务",
    execution: "mutate",
    targetSection: "activities",
    rewardPreview: { score: 5, drawProgress: 1, drawChances: 0 },
    ...overrides
  } as DerivedGameplayStep;
}

function buildProps(overrides?: Partial<HomeTabProps>): HomeTabProps {
  return {
    loading: false,
    progression: baseProgression(),
    activeSession: null,
    elapsedLabel: "00:00",
    activeSessionOverLimit: false,
    lastResult: null,
    progressionClaim: null,
    nextStep: baseNextStep(),
    todayLoop: baseTodayLoop(),
    actions: {
      startSession: () => {},
      finishSession: () => {},
      claimDailyReward: () => {},
      claimWeeklyReward: () => {},
      runNextStep: () => {},
      runTodayLoopAction: () => {}
    },
    ...overrides
  } as HomeTabProps;
}

describe("deriveHomeSurface", () => {
  it("exposes compact identity from progression", () => {
    const surface = deriveHomeSurface(buildProps());
    expect(surface.identity).toMatchObject({
      level: 3,
      xp: 120,
      levelXp: 20,
      nextLevelXp: 100,
      xpToNext: 80,
      currentStreak: 5,
      longestStreak: 12
    });
  });

  it("reports an active check-in that can finish", () => {
    const session = { id: "s1", status: "active", startedAt: new Date().toISOString() } as CheckInSession;
    const surface = deriveHomeSurface(
      buildProps({ activeSession: session, elapsedLabel: "12:34" })
    );
    expect(surface.activeCheckIn).toMatchObject({
      isActive: true,
      elapsedLabel: "12:34",
      canStart: false,
      canFinish: true
    });
  });

  it("flags over-limit active session", () => {
    const surface = deriveHomeSurface(
      buildProps({ activeSessionOverLimit: true })
    );
    expect(surface.activeCheckIn.overLimit).toBe(true);
  });

  it("reports idle state that can start when not loading", () => {
    const surface = deriveHomeSurface(buildProps());
    expect(surface.activeCheckIn).toMatchObject({
      isActive: false,
      canStart: true,
      canFinish: false
    });
  });

  it("disables start/finish while loading", () => {
    const surface = deriveHomeSurface(buildProps({ loading: true }));
    expect(surface.activeCheckIn.canStart).toBe(false);
    expect(surface.activeCheckIn.canFinish).toBe(false);
  });

  it("surfaces a non-check-in primary route action", () => {
    const primary = {
      kind: "activity",
      title: "领取任务",
      actionLabel: "去做任务",
      execution: "mutate",
      targetSection: "activities",
      rewardPreview: { score: 1, drawProgress: 1, drawChances: 0 }
    };
    const surface = deriveHomeSurface(
      buildProps({ todayLoop: baseTodayLoop({ primaryNextAction: primary as any }) })
    );
    expect(surface.primaryAction).toEqual(primary);
  });

  it("does not duplicate check-in actions outside the status panel", () => {
    const primary = {
      kind: "check-in",
      title: "开始休息",
      actionLabel: "开始打卡",
      execution: "mutate",
      targetSection: "home",
      rewardPreview: { score: 1, drawProgress: 1, drawChances: 0 }
    };
    const surface = deriveHomeSurface(
      buildProps({ todayLoop: baseTodayLoop({ primaryNextAction: primary as any }) })
    );
    expect(surface.primaryAction).toBeNull();
    expect(surface.fallbackStep).toBeNull();
  });

  it("provides a fallback step when no primary action and not done", () => {
    const nextStep = baseNextStep();
    const surface = deriveHomeSurface(
      buildProps({
        todayLoop: baseTodayLoop({ primaryNextAction: null }),
        nextStep
      })
    );
    expect(surface.fallbackStep).toEqual(nextStep);
  });

  it("does not provide fallback when route is done for today", () => {
    const surface = deriveHomeSurface(
      buildProps({
        todayLoop: baseTodayLoop({
          primaryNextAction: null,
          routeDelight: {
            mood: "done-for-today",
            title: "收工",
            copy: "",
            doneForToday: true
          }
        })
      })
    );
    expect(surface.primaryAction).toBeNull();
    expect(surface.fallbackStep).toBeNull();
    expect(surface.doneForToday).toBe(true);
  });

  it("lists durable check-in and progression-claim results in order", () => {
    const checkIn = {
      session: { id: "s1" },
      reward: { score: 1, drawProgress: 1, rewarded: true }
    } as CheckInFinishResult;
    const claim = {
      period: "daily",
      awarded: true,
      claimedAt: "2026-07-13T10:00:00Z",
      reward: { score: 10, drawProgress: 2, drawChancesGranted: 0 },
      progression: { leveledUp: false, previousLevel: 3, currentLevel: 3 }
    } as ProgressionClaimResult;
    const surface = deriveHomeSurface(
      buildProps({ lastResult: checkIn, progressionClaim: claim })
    );
    expect(surface.durableResults).toHaveLength(2);
    expect(surface.durableResults[0].kind).toBe("check-in");
    expect(surface.durableResults[1].kind).toBe("progression-claim");
  });

  it("builds goal summaries with claimable and claimed states", () => {
    const surface = deriveHomeSurface(buildProps());
    const daily = surface.goalSummaries.find((g) => g.period === "daily")!;
    const weekly = surface.goalSummaries.find((g) => g.period === "weekly")!;
    expect(daily).toMatchObject({
      completed: 1,
      total: 3,
      claimable: false,
      claimed: false
    });
    expect(weekly).toMatchObject({
      completed: 3,
      total: 3,
      claimable: false,
      claimed: true
    });
  });

  it("marks a goal summary claimable when all completed and not claimed", () => {
    const progression = baseProgression({
      dailyGoals: {
        ...baseProgression().dailyGoals,
        completed: 3,
        total: 3,
        allCompleted: true,
        rewardClaimed: false
      } as any
    });
    const surface = deriveHomeSurface(buildProps({ progression }));
    const daily = surface.goalSummaries.find((g) => g.period === "daily")!;
    expect(daily.claimable).toBe(true);
    expect(daily.claimed).toBe(false);
  });

  it("passes through secondary actions", () => {
    const secondary = [
      {
        kind: "leaderboard",
        title: "看榜",
        actionLabel: "看榜",
        execution: "navigate",
        targetSection: "rankings",
        rewardPreview: null
      }
    ];
    const surface = deriveHomeSurface(
      buildProps({ todayLoop: baseTodayLoop({ secondaryActions: secondary as any }) })
    );
    expect(surface.secondaryActions).toEqual(secondary);
  });

  it("passes through route progress and steps", () => {
    const todayLoop = baseTodayLoop({
      routeProgress: {
        completedCoreSteps: 2,
        totalCoreSteps: 4,
        percent: 50,
        progressLabel: "2/4",
        stageLabel: "当前：做任务"
      },
      routeSteps: [
        {
          kind: "check-in",
          id: "today-check-in",
          title: "休息",
          description: "完成一次带薪休息",
          actionLabel: "已完成",
          targetSection: "home",
          status: "completed",
          rewardPreview: null,
          progress: null
        }
      ] as any
    });
    const surface = deriveHomeSurface(buildProps({ todayLoop }));
    expect(surface.routeProgress).toEqual(todayLoop.routeProgress);
    expect(surface.routeSteps).toEqual(todayLoop.routeSteps);
  });
});
