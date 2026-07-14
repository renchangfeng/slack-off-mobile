import type { CheckInFinishResult } from "../../api/checkins";
import type { ProgressionClaimResult } from "../../api/progression";
import type {
  TodayLoopAction,
  TodayLoopStep,
  TodayLoopViewModel
} from "../../gameplay/todayLoop";
import type { HomeTabProps } from "./types";

export type HomeDurableResult =
  | { kind: "check-in"; result: CheckInFinishResult }
  | { kind: "progression-claim"; result: ProgressionClaimResult };

export type HomeGoalSummary = {
  period: "daily" | "weekly";
  title: string;
  completed: number;
  total: number;
  rewardScore: number;
  rewardDrawProgress: number;
  claimable: boolean;
  claimed: boolean;
};

export type HomeIdentity = {
  level: number;
  xp: number;
  levelXp: number;
  nextLevelXp: number;
  xpToNext: number;
  currentStreak: number;
  longestStreak: number;
};

export type HomeActiveCheckIn = {
  isActive: boolean;
  elapsedLabel: string;
  overLimit: boolean;
  canStart: boolean;
  canFinish: boolean;
};

export type HomeSurface = {
  identity: HomeIdentity;
  activeCheckIn: HomeActiveCheckIn;
  primaryAction: TodayLoopAction | null;
  fallbackStep: HomeTabProps["nextStep"] | null;
  durableResults: HomeDurableResult[];
  routeProgress: TodayLoopViewModel["routeProgress"];
  routeSteps: TodayLoopStep[];
  goalSummaries: HomeGoalSummary[];
  secondaryActions: TodayLoopAction[];
  doneForToday: boolean;
};

function buildIdentity(progression: HomeTabProps["progression"]): HomeIdentity {
  const level = progression?.level ?? 1;
  const xp = progression?.experience ?? 0;
  const currentLevelXp = progression?.currentLevelExperience ?? 0;
  const nextLevelXp = progression?.nextLevelExperience ?? 100;
  return {
    level,
    xp,
    levelXp: currentLevelXp,
    nextLevelXp,
    xpToNext: Math.max(0, nextLevelXp - currentLevelXp),
    currentStreak: progression?.currentStreakDays ?? 0,
    longestStreak: progression?.longestStreakDays ?? 0
  };
}

function buildActiveCheckIn(
  activeSession: HomeTabProps["activeSession"],
  elapsedLabel: HomeTabProps["elapsedLabel"],
  overLimit: HomeTabProps["activeSessionOverLimit"],
  loading: boolean
): HomeActiveCheckIn {
  const isActive = Boolean(activeSession);
  return {
    isActive,
    elapsedLabel,
    overLimit,
    canStart: !loading && !isActive,
    canFinish: !loading && isActive
  };
}

function buildGoalSummaries(progression: HomeTabProps["progression"]): HomeGoalSummary[] {
  const daily = progression?.dailyGoals;
  const weekly = progression?.weeklyGoals;
  return [
    {
      period: "daily",
      title: "今日目标",
      completed: daily?.completed ?? 0,
      total: daily?.total ?? 3,
      rewardScore: daily?.reward.score ?? 0,
      rewardDrawProgress: daily?.reward.drawProgress ?? 0,
      claimable: Boolean(daily?.allCompleted && !daily?.rewardClaimed),
      claimed: Boolean(daily?.rewardClaimed)
    },
    {
      period: "weekly",
      title: "本周目标",
      completed: weekly?.completed ?? 0,
      total: weekly?.total ?? 3,
      rewardScore: weekly?.reward.score ?? 0,
      rewardDrawProgress: weekly?.reward.drawProgress ?? 0,
      claimable: Boolean(weekly?.allCompleted && !weekly?.rewardClaimed),
      claimed: Boolean(weekly?.rewardClaimed)
    }
  ];
}

function buildDurableResults(
  lastResult: HomeTabProps["lastResult"],
  progressionClaim: HomeTabProps["progressionClaim"]
): HomeDurableResult[] {
  const results: HomeDurableResult[] = [];
  if (lastResult) {
    results.push({ kind: "check-in", result: lastResult });
  }
  if (progressionClaim) {
    results.push({ kind: "progression-claim", result: progressionClaim });
  }
  return results;
}

function buildFallbackStep(
  primaryAction: TodayLoopAction | null,
  todayLoop: TodayLoopViewModel,
  nextStep: HomeTabProps["nextStep"]
): HomeTabProps["nextStep"] | null {
  const shouldShowFallback =
    !primaryAction &&
    !todayLoop.routeDelight.doneForToday &&
    todayLoop.routeDelight.mood !== "optional-follow-up";
  const handledByCheckInPanel =
    nextStep.kind === "start-checkin" || nextStep.kind === "finish-checkin";
  return shouldShowFallback && !handledByCheckInPanel ? nextStep : null;
}

export function deriveHomeSurface(props: HomeTabProps): HomeSurface {
  const {
    loading,
    progression,
    activeSession,
    elapsedLabel,
    activeSessionOverLimit,
    lastResult,
    progressionClaim,
    nextStep,
    todayLoop
  } = props;

  return {
    identity: buildIdentity(progression),
    activeCheckIn: buildActiveCheckIn(activeSession, elapsedLabel, activeSessionOverLimit, loading),
    primaryAction:
      todayLoop.primaryNextAction?.kind === "check-in"
        ? null
        : todayLoop.primaryNextAction,
    fallbackStep: buildFallbackStep(todayLoop.primaryNextAction, todayLoop, nextStep),
    durableResults: buildDurableResults(lastResult, progressionClaim),
    routeProgress: todayLoop.routeProgress,
    routeSteps: todayLoop.routeSteps,
    goalSummaries: buildGoalSummaries(progression),
    secondaryActions: todayLoop.secondaryActions,
    doneForToday: todayLoop.routeDelight.doneForToday
  };
}
