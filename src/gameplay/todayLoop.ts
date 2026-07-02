import type { AchievementList, AchievementRecommendation } from "../api/achievements";
import type { ActivityAssignment, ActivityCompleteResult } from "../api/activities";
import type { BeanCollection, BeanDrawResult } from "../api/beans";
import type { CheckInFinishResult, CheckInSession } from "../api/checkins";
import type { ProgressionGoal, ProgressionSummary } from "../api/progression";
import type { DashboardTab } from "./dashboardTabs";

export type TodayLoopStepKind =
  | "check-in"
  | "activity"
  | "bean-draw"
  | "goal-reward"
  | "achievement"
  | "leaderboard";

export type TodayLoopStepStatus =
  | "pending"
  | "active"
  | "completed"
  | "claimable"
  | "optional";

export type TodayLoopRewardPreview = {
  score: number;
  drawProgress: number;
  drawChances: number;
};

export type TodayLoopStep = {
  kind: TodayLoopStepKind;
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  targetSection: DashboardTab;
  status: TodayLoopStepStatus;
  rewardPreview: TodayLoopRewardPreview | null;
  progress: { current: number; target: number; unit: string } | null;
};

export type TodayLoopAction = {
  kind: TodayLoopStepKind;
  title: string;
  description: string;
  actionLabel: string;
  targetSection: DashboardTab;
  rewardPreview: TodayLoopRewardPreview | null;
  meta?: Record<string, unknown>;
};

export type TodayLoopObjective = {
  code: string;
  title: string;
  description: string;
  completed: boolean;
  current: number;
  target: number;
  unit: string;
};

export type TodayLoopResultFollowUp = {
  primary: TodayLoopAction | null;
  secondary: TodayLoopAction[];
};

export type TodayLoopViewModel = {
  routeSteps: TodayLoopStep[];
  primaryNextAction: TodayLoopAction | null;
  secondaryActions: TodayLoopAction[];
  todayObjectives: TodayLoopObjective[];
  loopMessage: string;
  resultFollowUps: TodayLoopResultFollowUp;
  drawChanceSource: "check-in" | "activity" | "goal-reward" | "fragment-exchange" | null;
};

export type TodayLoopInput = {
  activeSession: CheckInSession | null;
  lastResult: CheckInFinishResult | null;
  activityAssignment: ActivityAssignment | null;
  activityResult: ActivityCompleteResult | null;
  beanCollection: BeanCollection | null;
  beanDrawResult: BeanDrawResult | null;
  progression: ProgressionSummary | null;
  achievementList: AchievementList | null;
  activityUnavailable: boolean;
};

export function deriveTodayPlayLoop(input: TodayLoopInput): TodayLoopViewModel {
  const {
    activeSession,
    lastResult,
    activityAssignment,
    activityResult,
    beanCollection,
    beanDrawResult,
    progression,
    achievementList,
    activityUnavailable
  } = input;

  const checkInGoal = findGoal(progression, "check_in");
  const activityGoal = findGoal(progression, "activity");
  const beanDrawGoal = findGoal(progression, "bean_draw");
  const dailyGoalsCompleted = progression?.dailyGoals.allCompleted ?? false;
  const dailyRewardClaimed = progression?.dailyGoals.rewardClaimed ?? true;
  const weeklyRewardClaimed = progression?.weeklyGoals.rewardClaimed ?? true;
  const weeklyClaimable = progression?.weeklyGoals.allCompleted && !weeklyRewardClaimed;
  const dailyClaimable = dailyGoalsCompleted && !dailyRewardClaimed;
  const claimableGoalPeriod: "daily" | "weekly" | null = dailyClaimable
    ? "daily"
    : weeklyClaimable
      ? "weekly"
      : null;

  const drawChances = beanCollection?.drawChances ?? 0;
  const activityJustCompletedWithDrawChance = Boolean(
    activityResult && activityResult.reward.drawChancesGranted > 0
  );
  const checkInJustFinishedWithDrawChance = Boolean(
    lastResult && (lastResult.reward.drawChancesGranted ?? 0) > 0
  );

  const drawChanceSource: TodayLoopViewModel["drawChanceSource"] = (() => {
    if (drawChances <= 0) return null;
    if (activityJustCompletedWithDrawChance) return "activity";
    if (checkInJustFinishedWithDrawChance) return "check-in";
    return null;
  })();

  const activeActivity = activityAssignment?.status === "active";
  const completedActivity = Boolean(
    activityResult || activityAssignment?.status === "completed"
  );
  const checkInStartedToday = Boolean(activeSession || checkInGoal?.completed);

  const routeSteps = buildRouteSteps({
    activeSession,
    checkInGoal,
    activeActivity,
    completedActivity,
    drawChances,
    beanDrawResult,
    claimableGoalPeriod,
    achievementList,
    progression
  });

  const primaryNextAction = pickPrimaryNextAction({
    activeSession,
    checkInStartedToday,
    activeActivity,
    activityJustCompletedWithDrawChance,
    drawChances,
    claimableGoalPeriod,
    achievementList,
    progression
  });

  const secondaryActions = pickSecondaryActions({
    primaryNextAction,
    activeSession,
    activeActivity,
    claimableGoalPeriod,
    achievementList,
    drawChances,
    progression
  });

  const todayObjectives = buildTodayObjectives({
    checkInGoal,
    activityGoal,
    beanDrawGoal,
    achievementList
  });

  const loopMessage = buildLoopMessage({
    activeSession,
    checkInStartedToday,
    activeActivity,
    activityJustCompletedWithDrawChance,
    drawChances,
    claimableGoalPeriod,
    achievementList
  });

  const resultFollowUps = buildResultFollowUps({
    activityResult,
    lastResult,
    beanDrawResult,
    claimableGoalPeriod,
    achievementList,
    activeActivity,
    activityUnavailable,
    checkInStartedToday,
    progression
  });

  return {
    routeSteps,
    primaryNextAction,
    secondaryActions,
    todayObjectives,
    loopMessage,
    resultFollowUps,
    drawChanceSource
  };
}

function findGoal(
  progression: ProgressionSummary | null,
  code: ProgressionGoal["code"]
): ProgressionGoal | undefined {
  return progression?.dailyGoals.goals.find((goal) => goal.code === code);
}

function mapRecommendationTarget(section: AchievementRecommendation["targetSection"]): DashboardTab {
  return section === "leaderboards" ? "rankings" : section;
}

function goalRewardPreview(
  period: "daily" | "weekly",
  progression: ProgressionSummary | null
): TodayLoopRewardPreview {
  const reward =
    period === "daily" ? progression?.dailyGoals.reward : progression?.weeklyGoals.reward;
  return {
    score: reward?.score ?? 0,
    drawProgress: reward?.drawProgress ?? 0,
    drawChances: 0
  };
}

function buildRouteSteps(state: {
  activeSession: CheckInSession | null;
  checkInGoal: ProgressionGoal | undefined;
  activeActivity: boolean;
  completedActivity: boolean;
  drawChances: number;
  beanDrawResult: BeanDrawResult | null;
  claimableGoalPeriod: "daily" | "weekly" | null;
  achievementList: AchievementList | null;
  progression: ProgressionSummary | null;
}): TodayLoopStep[] {
  const {
    activeSession,
    checkInGoal,
    activeActivity,
    completedActivity,
    drawChances,
    beanDrawResult,
    claimableGoalPeriod,
    achievementList,
    progression
  } = state;

  const checkInStep: TodayLoopStep = {
    kind: "check-in",
    id: "today-check-in",
    title: activeSession ? "正在休息" : checkInGoal?.completed ? "已打卡" : "开始休息",
    description: activeSession
      ? "计时进行中，结束后结算分数和抽豆进度。"
      : checkInGoal?.completed
        ? "今天的带薪休息已经到位。"
        : "从一次带薪休息开始今天的摸鱼路线。",
    actionLabel: activeSession ? "结束打卡" : checkInGoal?.completed ? "已完成" : "开始打卡",
    targetSection: "home",
    status: activeSession ? "active" : checkInGoal?.completed ? "completed" : "pending",
    rewardPreview: { score: 1, drawProgress: 1, drawChances: 0 },
    progress: checkInGoal
      ? { current: checkInGoal.current, target: checkInGoal.target, unit: checkInGoal.unit }
      : null
  };

  const activityStep: TodayLoopStep = {
    kind: "activity",
    id: "today-activity",
    title: activeActivity ? "当前任务" : completedActivity ? "已完成任务" : "摸鱼任务",
    description: activeActivity
      ? "按任务描述完成互动步骤，然后领取奖励。"
      : completedActivity
        ? "今天的互动任务已经交差。"
        : "领一个随机摸鱼任务，继续攒抽豆进度。",
    actionLabel: activeActivity ? "去做任务" : completedActivity ? "已完成" : "领一个",
    targetSection: "activities",
    status: activeActivity ? "active" : completedActivity ? "completed" : "pending",
    rewardPreview: { score: 5, drawProgress: 1, drawChances: 0 },
    progress: null
  };

  const beanDrawStep: TodayLoopStep = {
    kind: "bean-draw",
    id: "today-bean-draw",
    title: drawChances > 0 ? "可以抽豆" : beanDrawResult ? "已抽豆" : "攒抽豆机会",
    description:
      drawChances > 0
        ? `有 ${drawChances} 次抽豆机会，不花掉就像把调休留到过期。`
        : beanDrawResult
          ? "刚抽完一颗豆，继续攒下一次机会。"
          : "完成打卡或摸鱼任务来攒抽豆进度。",
    actionLabel: drawChances > 0 ? "抽一颗" : beanDrawResult ? "已抽" : "等机会",
    targetSection: "beans",
    status: drawChances > 0 ? "claimable" : beanDrawResult ? "completed" : "pending",
    rewardPreview:
      drawChances > 0 ? { score: 0, drawProgress: 0, drawChances } : { score: 0, drawProgress: 0, drawChances: 0 },
    progress: null
  };

  const goalRewardStep: TodayLoopStep = {
    kind: "goal-reward",
    id: "today-goal-reward",
    title: claimableGoalPeriod ? "可领奖励" : "成长奖励",
    description: claimableGoalPeriod
      ? `今天的小目标凑齐了，可以领取${claimableGoalPeriod === "daily" ? "今日" : "本周"}奖励。`
      : "完成每日目标后领取额外的分数和抽豆进度。",
    actionLabel: claimableGoalPeriod ? "领奖励" : "攒目标",
    targetSection: "home",
    status: claimableGoalPeriod ? "claimable" : "pending",
    rewardPreview: claimableGoalPeriod ? goalRewardPreview(claimableGoalPeriod, progression) : null,
    progress: null
  };

  const achievements = achievementRecommendations(achievementList);
  const achievementStep: TodayLoopStep = {
    kind: "achievement",
    id: "today-achievement",
    title: achievements.length ? "附近成就" : "成就",
    description: achievements.length
      ? `有 ${achievements.length} 个成就可以顺手推进。`
      : "慢慢积累，成就自己会来。",
    actionLabel: achievements.length ? "看成就" : "去档案",
    targetSection: "profile",
    status: achievements.length ? "optional" : "pending",
    rewardPreview: null,
    progress: null
  };

  const leaderboardStep: TodayLoopStep = {
    kind: "leaderboard",
    id: "today-leaderboard",
    title: "看看榜",
    description: "看看今天谁把喘气这件事做得最认真，或者给朋友递张纸巾。",
    actionLabel: "看榜",
    targetSection: "rankings",
    status: "optional",
    rewardPreview: null,
    progress: null
  };

  return [checkInStep, activityStep, beanDrawStep, goalRewardStep, achievementStep, leaderboardStep];
}

function pickPrimaryNextAction(state: {
  activeSession: CheckInSession | null;
  checkInStartedToday: boolean;
  activeActivity: boolean;
  activityJustCompletedWithDrawChance: boolean;
  drawChances: number;
  claimableGoalPeriod: "daily" | "weekly" | null;
  achievementList: AchievementList | null;
  progression: ProgressionSummary | null;
}): TodayLoopAction | null {
  const {
    activeSession,
    checkInStartedToday,
    activeActivity,
    drawChances,
    claimableGoalPeriod,
    achievementList,
    progression
  } = state;

  if (activeSession) {
    return {
      kind: "check-in",
      title: "先把这次休息坐实",
      description: "计时正在进行。休息够了以后结束打卡，系统会结算分数和抽豆进度。",
      actionLabel: "结束并结算",
      targetSection: "home",
      rewardPreview: { score: 1, drawProgress: 1, drawChances: 0 }
    };
  }

  if (!checkInStartedToday) {
    return {
      kind: "check-in",
      title: "从一次带薪休息开始",
      description: "开始计时，结束后获得排行榜分数和抽豆进度，然后再去做随机摸鱼活动。",
      actionLabel: "开始打卡",
      targetSection: "home",
      rewardPreview: { score: 1, drawProgress: 1, drawChances: 0 }
    };
  }

  if (activeActivity) {
    return {
      kind: "activity",
      title: "当前摸鱼任务等你交差",
      description: "先按任务描述完成它，再回来领取分数和抽豆进度。",
      actionLabel: "去做任务",
      targetSection: "activities",
      rewardPreview: { score: 5, drawProgress: 1, drawChances: 0 }
    };
  }

  if (drawChances > 0) {
    return {
      kind: "bean-draw",
      title: `你有 ${drawChances} 次抽豆机会`,
      description: "机会已经到账，不花掉它就像把调休留到过期。",
      actionLabel: "立即抽豆",
      targetSection: "beans",
      rewardPreview: { score: 0, drawProgress: 0, drawChances }
    };
  }

  if (claimableGoalPeriod) {
    return {
      kind: "goal-reward",
      title: claimableGoalPeriod === "daily" ? "今日目标已达成" : "本周目标已达成",
      description: `小目标凑齐了，领取${claimableGoalPeriod === "daily" ? "今日" : "本周"}成长奖励。`,
      actionLabel: "领取奖励",
      targetSection: "home",
      rewardPreview: goalRewardPreview(claimableGoalPeriod, progression),
      meta: { period: claimableGoalPeriod }
    };
  }

  const achievement = firstAchievementRecommendation(achievementList);
  if (achievement) {
    return {
      kind: "achievement",
      title: achievement.name,
      description: `${achievement.recommendationReason} · ${achievement.remainingEffortLabel}`,
      actionLabel: achievement.actionHint.label,
      targetSection: mapRecommendationTarget(achievement.targetSection),
      rewardPreview: null,
      meta: { achievementId: achievement.id }
    };
  }

  return null;
}

function pickSecondaryActions(state: {
  primaryNextAction: TodayLoopAction | null;
  activeSession: CheckInSession | null;
  activeActivity: boolean;
  claimableGoalPeriod: "daily" | "weekly" | null;
  achievementList: AchievementList | null;
  drawChances: number;
  progression: ProgressionSummary | null;
}): TodayLoopAction[] {
  const { primaryNextAction, activeSession, activeActivity, claimableGoalPeriod, achievementList, drawChances, progression } =
    state;
  const actions: TodayLoopAction[] = [];

  if (claimableGoalPeriod && primaryNextAction?.kind !== "goal-reward") {
    actions.push({
      kind: "goal-reward",
      title: claimableGoalPeriod === "daily" ? "今日奖励待领" : "本周奖励待领",
      description: "目标已经达成，顺手把奖励领了。",
      actionLabel: "领奖励",
      targetSection: "home",
      rewardPreview: goalRewardPreview(claimableGoalPeriod, progression),
      meta: { period: claimableGoalPeriod }
    });
  }

  if (drawChances > 0 && primaryNextAction?.kind !== "bean-draw") {
    actions.push({
      kind: "bean-draw",
      title: `${drawChances} 次抽豆机会`,
      description: "机会还在，随时可以抽。",
      actionLabel: "去抽豆",
      targetSection: "beans",
      rewardPreview: { score: 0, drawProgress: 0, drawChances }
    });
  }

  const achievements = achievementRecommendations(achievementList).slice(0, 3);
  const secondaryAchievement = achievements.find((item) => item.id !== primaryNextAction?.meta?.achievementId);
  if (secondaryAchievement && primaryNextAction?.kind !== "achievement") {
    actions.push({
      kind: "achievement",
      title: secondaryAchievement.name,
      description: `${secondaryAchievement.recommendationReason} · ${secondaryAchievement.remainingEffortLabel}`,
      actionLabel: secondaryAchievement.actionHint.label,
      targetSection: mapRecommendationTarget(secondaryAchievement.targetSection),
      rewardPreview: null,
      meta: { achievementId: secondaryAchievement.id }
    });
  }

  if (!activeSession && !activeActivity && actions.length < 2) {
    actions.push({
      kind: "leaderboard",
      title: "看看榜",
      description: "给朋友递张纸巾，或者看看今天的喘气排名。",
      actionLabel: "看榜",
      targetSection: "rankings",
      rewardPreview: null
    });
  }

  return actions.slice(0, 2);
}

function buildTodayObjectives(state: {
  checkInGoal: ProgressionGoal | undefined;
  activityGoal: ProgressionGoal | undefined;
  beanDrawGoal: ProgressionGoal | undefined;
  achievementList: AchievementList | null;
}): TodayLoopObjective[] {
  const { checkInGoal, activityGoal, beanDrawGoal, achievementList } = state;
  const objectives: TodayLoopObjective[] = [];

  if (checkInGoal) {
    objectives.push(objectiveFromGoal("check-in", checkInGoal));
  }
  if (activityGoal) {
    objectives.push(objectiveFromGoal("activity", activityGoal));
  }
  if (beanDrawGoal) {
    objectives.push(objectiveFromGoal("bean-draw", beanDrawGoal));
  }

  const achievement = firstAchievementRecommendation(achievementList);
  if (achievement) {
    objectives.push({
      code: "achievement",
      title: "推进一个成就",
      description: achievement.name,
      completed: false,
      current: achievement.progress.current,
      target: achievement.progress.target,
      unit: achievement.progress.unit
    });
  }

  return objectives;
}

function objectiveFromGoal(code: string, goal: ProgressionGoal): TodayLoopObjective {
  return {
    code,
    title: goal.title,
    description: goal.description,
    completed: goal.completed,
    current: goal.current,
    target: goal.target,
    unit: goal.unit
  };
}

function buildLoopMessage(state: {
  activeSession: CheckInSession | null;
  checkInStartedToday: boolean;
  activeActivity: boolean;
  activityJustCompletedWithDrawChance: boolean;
  drawChances: number;
  claimableGoalPeriod: "daily" | "weekly" | null;
  achievementList: AchievementList | null;
}): string {
  if (state.activeSession) {
    return "先把这次休息坐实，系统会结算分数和抽豆进度。";
  }
  if (!state.checkInStartedToday) {
    return "从一次带薪休息开始，今天的摸鱼路线才算开张。";
  }
  if (state.activeActivity) {
    return "当前任务等你交差，完成互动步骤再领奖励。";
  }
  if (state.activityJustCompletedWithDrawChance || state.drawChances > 0) {
    return "有抽豆机会在等你，去豆仓试试手气。";
  }
  if (state.claimableGoalPeriod) {
    return "今天的小目标凑齐了，把成长奖励领了再决定下一步。";
  }
  if (firstAchievementRecommendation(state.achievementList)) {
    return "顺手再推进一个成就，或者去看看榜。";
  }
  return "今天已经很会休息了，去摸鱼吧——字面意义上的。";
}

function buildResultFollowUps(state: {
  activityResult: ActivityCompleteResult | null;
  lastResult: CheckInFinishResult | null;
  beanDrawResult: BeanDrawResult | null;
  claimableGoalPeriod: "daily" | "weekly" | null;
  achievementList: AchievementList | null;
  activeActivity: boolean;
  activityUnavailable: boolean;
  checkInStartedToday: boolean;
  progression: ProgressionSummary | null;
}): TodayLoopResultFollowUp {
  const {
    activityResult,
    lastResult,
    beanDrawResult,
    claimableGoalPeriod,
    achievementList,
    activeActivity,
    activityUnavailable,
    checkInStartedToday,
    progression
  } = state;

  if (activityResult) {
    return followUpsAfterActivity(activityResult, {
      claimableGoalPeriod,
      achievementList,
      activeActivity,
      activityUnavailable,
      checkInStartedToday,
      progression
    });
  }

  if (lastResult) {
    return followUpsAfterCheckIn(lastResult, {
      claimableGoalPeriod,
      achievementList,
      activeActivity,
      activityUnavailable,
      checkInStartedToday,
      progression
    });
  }

  if (beanDrawResult) {
    return followUpsAfterBeanDraw(beanDrawResult, {
      claimableGoalPeriod,
      achievementList,
      activeActivity,
      activityUnavailable,
      checkInStartedToday,
      progression
    });
  }

  return { primary: null, secondary: [] };
}

type FollowUpContext = {
  claimableGoalPeriod: "daily" | "weekly" | null;
  achievementList: AchievementList | null;
  activeActivity: boolean;
  activityUnavailable: boolean;
  checkInStartedToday: boolean;
  progression: ProgressionSummary | null;
};

function secondaryFollowUps(ctx: FollowUpContext): TodayLoopAction[] {
  const secondary: TodayLoopAction[] = [];

  if (ctx.claimableGoalPeriod) {
    secondary.push({
      kind: "goal-reward",
      title: ctx.claimableGoalPeriod === "daily" ? "领今日奖励" : "领本周奖励",
      description: "目标已经达成，顺手把奖励领了。",
      actionLabel: "领奖励",
      targetSection: "home",
      rewardPreview: goalRewardPreview(ctx.claimableGoalPeriod, ctx.progression),
      meta: { period: ctx.claimableGoalPeriod }
    });
  }

  const achievement = firstAchievementRecommendation(ctx.achievementList);
  if (achievement) {
    secondary.push({
      kind: "achievement",
      title: achievement.name,
      description: `${achievement.recommendationReason} · ${achievement.remainingEffortLabel}`,
      actionLabel: achievement.actionHint.label,
      targetSection: mapRecommendationTarget(achievement.targetSection),
      rewardPreview: null,
      meta: { achievementId: achievement.id }
    });
  }

  return secondary;
}

function followUpsAfterActivity(
  result: ActivityCompleteResult,
  ctx: FollowUpContext
): TodayLoopResultFollowUp {
  const secondary = secondaryFollowUps(ctx);

  if (result.reward.drawChancesGranted > 0) {
    return {
      primary: {
        kind: "bean-draw",
        title: "去抽豆",
        description: `活动刚贡献了 ${result.reward.drawChancesGranted} 次抽豆机会。`,
        actionLabel: "立即抽豆",
        targetSection: "beans",
        rewardPreview: { score: 0, drawProgress: 0, drawChances: result.reward.drawChancesGranted }
      },
      secondary: secondary.slice(0, 2)
    };
  }

  if (ctx.activeActivity) {
    return {
      primary: {
        kind: "activity",
        title: "继续当前任务",
        description: "还有一个活动等你完成。",
        actionLabel: "去做任务",
        targetSection: "activities",
        rewardPreview: { score: 5, drawProgress: 1, drawChances: 0 }
      },
      secondary: secondary.slice(0, 2)
    };
  }

  if (!ctx.checkInStartedToday) {
    return {
      primary: {
        kind: "check-in",
        title: "先完成一次打卡",
        description: "今天的休息路线还没开始。",
        actionLabel: "开始打卡",
        targetSection: "home",
        rewardPreview: { score: 1, drawProgress: 1, drawChances: 0 }
      },
      secondary: secondary.slice(0, 2)
    };
  }

  if (!ctx.activityUnavailable) {
    return {
      primary: {
        kind: "activity",
        title: "再来一个",
        description: "再完成一个摸鱼任务，继续攒抽豆进度。",
        actionLabel: "领任务",
        targetSection: "activities",
        rewardPreview: { score: 5, drawProgress: 1, drawChances: 0 }
      },
      secondary: secondary.slice(0, 2)
    };
  }

  return { primary: null, secondary: secondary.slice(0, 2) };
}

function followUpsAfterCheckIn(
  result: CheckInFinishResult,
  ctx: FollowUpContext
): TodayLoopResultFollowUp {
  const secondary = secondaryFollowUps(ctx);

  if ((result.reward.drawChancesGranted ?? 0) > 0) {
    return {
      primary: {
        kind: "bean-draw",
        title: "去抽豆",
        description: `打卡贡献了 ${result.reward.drawChancesGranted} 次抽豆机会。`,
        actionLabel: "立即抽豆",
        targetSection: "beans",
        rewardPreview: {
          score: 0,
          drawProgress: 0,
          drawChances: result.reward.drawChancesGranted ?? 0
        }
      },
      secondary: secondary.slice(0, 2)
    };
  }

  if (ctx.activeActivity) {
    return {
      primary: {
        kind: "activity",
        title: "当前任务等你",
        description: "还有一个活动没完成。",
        actionLabel: "去做任务",
        targetSection: "activities",
        rewardPreview: { score: 5, drawProgress: 1, drawChances: 0 }
      },
      secondary: secondary.slice(0, 2)
    };
  }

  if (!ctx.activityUnavailable) {
    return {
      primary: {
        kind: "activity",
        title: "去做个摸鱼任务",
        description: "完成随机摸鱼任务也能增加抽豆进度。",
        actionLabel: "领任务",
        targetSection: "activities",
        rewardPreview: { score: 5, drawProgress: 1, drawChances: 0 }
      },
      secondary: secondary.slice(0, 2)
    };
  }

  return { primary: null, secondary: secondary.slice(0, 2) };
}

function followUpsAfterBeanDraw(
  result: BeanDrawResult,
  ctx: FollowUpContext
): TodayLoopResultFollowUp {
  const secondary = secondaryFollowUps(ctx);

  if (result.remainingDrawChances > 0) {
    return {
      primary: {
        kind: "bean-draw",
        title: "继续抽豆",
        description: `还有 ${result.remainingDrawChances} 次机会。`,
        actionLabel: "再抽一颗",
        targetSection: "beans",
        rewardPreview: { score: 0, drawProgress: 0, drawChances: result.remainingDrawChances }
      },
      secondary: secondary.slice(0, 2)
    };
  }

  if (ctx.activeActivity) {
    return {
      primary: {
        kind: "activity",
        title: "当前任务等你",
        description: "还有一个活动没完成。",
        actionLabel: "去做任务",
        targetSection: "activities",
        rewardPreview: { score: 5, drawProgress: 1, drawChances: 0 }
      },
      secondary: secondary.slice(0, 2)
    };
  }

  if (!ctx.activityUnavailable) {
    return {
      primary: {
        kind: "activity",
        title: "再做个任务",
        description: "继续攒抽豆进度。",
        actionLabel: "领任务",
        targetSection: "activities",
        rewardPreview: { score: 5, drawProgress: 1, drawChances: 0 }
      },
      secondary: secondary.slice(0, 2)
    };
  }

  return { primary: null, secondary: secondary.slice(0, 2) };
}

function achievementRecommendations(list: AchievementList | null): AchievementRecommendation[] {
  if (!list) return [];
  const today = list.recommendations.today;
  const nearest = list.recommendations.nearest;
  if (today.length) return today.slice(0, 3);
  if (nearest.length) return nearest.slice(0, 3);
  return [];
}

function firstAchievementRecommendation(list: AchievementList | null): AchievementRecommendation | null {
  return achievementRecommendations(list)[0] ?? null;
}
