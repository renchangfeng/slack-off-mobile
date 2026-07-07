import type {
  Achievement,
  AchievementList,
  AchievementRecommendation
} from "../../api/achievements";
import type {
  ActivityAssignment,
  ActivityCatalog,
  ActivityCategory,
  ActivityHistorySession,
  ActivityInteractionProgress,
  ActivityPresentation,
  ActivityRandomRequest,
  ActivitySkipReason
} from "../../api/activities";
import type { BeanTheme } from "../../api/beans";
import type { LeaderboardResponse, LeaderboardScope, LeaderboardWindow } from "../../api/leaderboards";
import type { ProgressionSummary } from "../../api/progression";
import type { DashboardTab } from "../../gameplay/dashboardTabs";
import type { Dispatch, SetStateAction } from "react";
import {
  isStepComplete as isActivityStepComplete,
  markAck as markAckStep,
  markBreathRounds as markBreathStep,
  markChoice as markChoiceStep,
  markJournalEntry as markJournalStep,
  markMiniGame as markMiniGameStep,
  markReactionResult as markReactionStep,
  markSelectedOption as markSelectedOptionStep,
  markSortedItems as markSortStep,
  markTapPattern as markTapPatternStep,
  markTimer as markTimerStep
} from "./parts/activity-interactions/interactionProgress";

export {
  isActivityStepComplete,
  markAckStep,
  markBreathStep,
  markChoiceStep,
  markJournalStep,
  markMiniGameStep,
  markReactionStep,
  markSelectedOptionStep,
  markSortStep,
  markTapPatternStep,
  markTimerStep
};

export function formatDuration(startedAt: string, now: number): string {
  const seconds = Math.max(0, Math.floor((now - Date.parse(startedAt)) / 1000));
  if (seconds > 45 * 60) {
    return "45:00+";
  }
  return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60)
    .toString()
    .padStart(2, "0")}`;
}

export function activityCategoryLabel(category: string): string {
  return (
    {
      rest: "安静休息",
      game: "小游戏",
      office_theater: "办公室表演",
      physical: "身体活动",
      imagination: "脑洞任务"
    }[category] ?? category
  );
}

export function difficultyLabel(difficulty: string): string {
  return ({ easy: "轻松", normal: "正常", hard: "硬核" }[difficulty] ?? difficulty);
}

export function flavorLabel(flavor: string): string {
  return (
    {
      quick: "快速完成",
      weird: "脑洞一点",
      recharge: "充电恢复",
      tiny_challenge: "小挑战",
      tiny_reflection: "小反思"
    }[flavor] ?? flavor
  );
}

export function beanThemeLabel(theme: string): string {
  return (
    {
      office: "工位卡池",
      restroom: "隔间卡池",
      daydream: "白日梦卡池"
    }[theme] ?? theme
  );
}

export function rarityLabel(rarity: string): string {
  return (
    {
      common: "普通",
      uncommon: "少见",
      rare: "稀有",
      epic: "史诗",
      legendary: "传说"
    }[rarity] ?? rarity
  );
}

export function formatActivityTime(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function formatCooldown(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} 秒`;
  }
  if (seconds < 60 * 60) {
    return `${Math.ceil(seconds / 60)} 分钟`;
  }
  return `${Math.ceil(seconds / 3600)} 小时`;
}

export function historySessionTimeValue(session: ActivityHistorySession): string | null {
  return session.sessionAt ?? session.completedAt ?? session.assignedAt ?? null;
}

export function formatHistorySessionTime(value: string | null | undefined): string {
  if (!value) return "时间未知";
  const time = new Date(value);
  if (Number.isNaN(time.getTime())) return "时间未知";
  return formatActivityTime(value);
}

export function historyStatusLabel(
  status: ActivityAssignment["status"],
  rewarded: boolean
): string {
  if (status === "completed") return rewarded ? "已完成" : "未完成奖励";
  if (status === "skipped") return "已跳过";
  if (status === "expired") return "已过期";
  return "进行中";
}

export function deriveHistorySections(history: ActivityHistorySession[]): {
  today: ActivityHistorySession[];
  recent: ActivityHistorySession[];
} {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const today: ActivityHistorySession[] = [];
  const recent: ActivityHistorySession[] = [];
  for (const session of history) {
    const sessionTime = historySessionTimeValue(session);
    const sessionDate = sessionTime ? new Date(sessionTime) : null;
    if (!sessionDate || Number.isNaN(sessionDate.getTime())) {
      recent.push(session);
      continue;
    }
    if (sessionDate >= startOfToday) {
      today.push(session);
    } else {
      recent.push(session);
    }
  }
  return { today, recent };
}

export function resolveHistoryPresentation(
  session: ActivityHistorySession
): ActivityPresentation {
  return (
    session.presentation ??
    resolveActivityPresentation({
      title: session.title,
      description: session.description,
      category: session.category,
      difficulty: session.difficulty
    })
  );
}

export function buildReplaySimilarRequest(session: ActivityHistorySession): ActivityRandomRequest {
  return {
    replayHint: {
      sourceAssignmentId: session.assignmentId,
      preferredCategory: session.category,
      preferredFlavor: session.flavor ?? undefined,
      excludeTemplateId: session.templateId
    }
  };
}

export type ActivityFlavor = NonNullable<ActivityHistorySession["flavor"]>;

export type HistorySessionStatusTone = "active" | "completed" | "locked" | "warning" | "default";

export function historySessionStatusTone(
  status: ActivityAssignment["status"],
  rewarded: boolean
): HistorySessionStatusTone {
  if (status === "completed") {
    return rewarded ? "completed" : "warning";
  }
  if (status === "skipped") return "warning";
  if (status === "expired") return "locked";
  return "default";
}

export function skipReasonLabel(reason: ActivitySkipReason): string {
  return (
    {
      not_interested: "没兴趣",
      too_much_work: "太麻烦",
      not_convenient: "不方便",
      want_weirder: "想来点怪的",
      other: "换个口味"
    }[reason] ?? reason
  );
}

export type ActivityDailyReport = {
  completedCount: number;
  skippedCount: number;
  expiredCount: number;
  totalScore: number;
  totalDrawProgress: number;
  dominantCategory: ActivityCategory | null;
  dominantFlavor: ActivityFlavor | null;
  summary: string;
  hasToday: boolean;
};

function historyRewardSummary(session: ActivityHistorySession): {
  score: number;
  drawProgress: number;
  rewarded: boolean;
} {
  return session.rewardSummary ?? { score: 0, drawProgress: 0, rewarded: false };
}

function countBy<T extends string>(items: T[]): Map<T, number> {
  const counts = new Map<T, number>();
  for (const item of items) {
    counts.set(item, (counts.get(item) ?? 0) + 1);
  }
  return counts;
}

function maxByCount<T>(counts: Map<T, number>): T | null {
  let best: T | null = null;
  let bestCount = 0;
  for (const [key, count] of counts) {
    if (count > bestCount) {
      best = key;
      bestCount = count;
    }
  }
  return best;
}

function dominantCategory(sessions: ActivityHistorySession[]): ActivityCategory | null {
  return maxByCount(countBy(sessions.map((session) => session.category)));
}

function dominantFlavor(sessions: ActivityHistorySession[]): ActivityFlavor | null {
  const flavors = sessions.map((session) => session.flavor).filter(Boolean) as ActivityFlavor[];
  return flavors.length > 0 ? maxByCount(countBy(flavors)) : null;
}

export function deriveActivityDailyReport(history: ActivityHistorySession[]): ActivityDailyReport {
  const { today } = deriveHistorySections(history);
  const completedToday = today.filter((session) => session.status === "completed");
  const skippedToday = today.filter((session) => session.status === "skipped");
  const expiredToday = today.filter((session) => session.status === "expired");

  const completedCount = completedToday.length;
  const skippedCount = skippedToday.length;
  const expiredCount = expiredToday.length;

  const rewardedToday = completedToday.filter((session) => historyRewardSummary(session).rewarded);
  const totalScore = rewardedToday.reduce((sum, session) => sum + historyRewardSummary(session).score, 0);
  const totalDrawProgress = rewardedToday.reduce(
    (sum, session) => sum + historyRewardSummary(session).drawProgress,
    0
  );

  const dominantCat =
    dominantCategory(completedToday) ?? dominantCategory(today);
  const dominantFlav =
    dominantFlavor(completedToday) ?? dominantFlavor(today);

  const summary = buildDailyReportSummary({
    completedCount,
    skippedCount,
    expiredCount,
    totalScore,
    totalDrawProgress,
    dominantCategory: dominantCat,
    dominantFlavor: dominantFlav,
    hasToday: today.length > 0
  });

  return {
    completedCount,
    skippedCount,
    expiredCount,
    totalScore,
    totalDrawProgress,
    dominantCategory: dominantCat,
    dominantFlavor: dominantFlav,
    summary,
    hasToday: today.length > 0
  };
}

function buildDailyReportSummary(report: {
  completedCount: number;
  skippedCount: number;
  expiredCount: number;
  totalScore: number;
  totalDrawProgress: number;
  dominantCategory: ActivityCategory | null;
  dominantFlavor: ActivityFlavor | null;
  hasToday: boolean;
}): string {
  if (!report.hasToday) {
    return "今天还没有摸鱼记录。来个短平快的，给自己开个小差。";
  }

  const totalUnrewarded = report.skippedCount + report.expiredCount;
  const categoryLabel = report.dominantCategory
    ? activityCategoryLabel(report.dominantCategory)
    : null;
  const flavorLabel = report.dominantFlavor ? flavorLabelHelper(report.dominantFlavor) : null;

  if (report.completedCount > 0 && totalUnrewarded === 0) {
    const base = `今天完成了 ${report.completedCount} 个小休息，累计 +${report.totalScore} 分`;
    if (report.totalDrawProgress > 0) {
      return `${base} · 进度 +${report.totalDrawProgress}。${flavorLabel ?? categoryLabel ?? "继续"} 是你的首选。`;
    }
    return `${base}。${flavorLabel ?? categoryLabel ?? "继续"} 是你的首选。`;
  }

  if (report.completedCount > 0 && totalUnrewarded > 0) {
    return `今天完成了 ${report.completedCount} 个，跳过了 ${totalUnrewarded} 个。${flavorLabel ?? categoryLabel ?? "这个节奏"} 型任务出现最多。`;
  }

  if (totalUnrewarded > 0) {
    return `今天跳过了 ${totalUnrewarded} 个任务。没关系，偏好也是数据。`;
  }

  return "今天活动记录有点特别，慢慢来。";
}

export type ActivityHistoryInsights = {
  dominantCategory7d: ActivityCategory | null;
  dominantFlavor7d: ActivityFlavor | null;
  commonSkipReason: ActivitySkipReason | null;
  suggestion: string | null;
  hasEnoughData: boolean;
  skipHeavy: boolean;
};

export function deriveActivityHistoryInsights(
  history: ActivityHistorySession[],
  windowDays = 7
): ActivityHistoryInsights {
  const cutoff = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
  const recent = history.filter((session) => {
    const sessionTime = historySessionTimeValue(session);
    if (!sessionTime) return false;
    const sessionDate = new Date(sessionTime);
    return !Number.isNaN(sessionDate.getTime()) && sessionDate >= cutoff;
  });

  if (recent.length === 0) {
    return {
      dominantCategory7d: null,
      dominantFlavor7d: null,
      commonSkipReason: null,
      suggestion: null,
      hasEnoughData: false,
      skipHeavy: false
    };
  }

  const skipped = recent.filter((session) => session.status === "skipped");
  const skipReasons = skipped
    .map((session) => session.skipReason)
    .filter(Boolean) as ActivitySkipReason[];

  const commonReason = skipReasons.length > 0 ? maxByCount(countBy(skipReasons)) : null;
  const skipHeavy = skipped.length >= 2 && skipped.length / recent.length >= 0.5;
  const hasEnoughData = recent.length >= 3 || skipped.length >= 2;

  const dominantCat = dominantCategory(recent);
  const dominantFlav = dominantFlavor(recent);

  const suggestion = buildInsightSuggestion({
    skipHeavy,
    dominantCategory: dominantCat,
    dominantFlavor: dominantFlav,
    commonSkipReason: commonReason,
    hasEnoughData
  });

  return {
    dominantCategory7d: dominantCat,
    dominantFlavor7d: dominantFlav,
    commonSkipReason: commonReason,
    suggestion,
    hasEnoughData,
    skipHeavy
  };
}

function buildInsightSuggestion(input: {
  skipHeavy: boolean;
  dominantCategory: ActivityCategory | null;
  dominantFlavor: ActivityFlavor | null;
  commonSkipReason: ActivitySkipReason | null;
  hasEnoughData: boolean;
}): string | null {
  if (!input.hasEnoughData) return null;

  if (input.skipHeavy) {
    return "最近跳过比较多。下次可以优先试试短平快的回血任务，或者按原因换推荐。";
  }

  if (input.dominantFlavor) {
    return `你最近偏爱 ${flavorLabelHelper(input.dominantFlavor)} 型任务，可以继续按这个节奏来。`;
  }

  if (input.dominantCategory) {
    return `你最近常选 ${activityCategoryLabel(input.dominantCategory)}，保持这个节奏就挺好。`;
  }

  if (input.commonSkipReason) {
    return `你最近常跳过任务因为“${skipReasonLabel(input.commonSkipReason)}”，推荐时会参考这一点。`;
  }

  return null;
}

function flavorLabelHelper(flavor: ActivityFlavor): string {
  return flavorLabel(flavor);
}

export function resolveActivityPresentation(activity: {
  title: string;
  description: string;
  category: string;
  difficulty: string;
  code?: string;
  presentation?: ActivityPresentation;
}): ActivityPresentation {
  if (activity.presentation) {
    return activity.presentation;
  }
  const statValue = fallbackActivityStatValue(activity.code ?? activity.title, activity.difficulty);
  if (activity.category === "game") {
    return {
      badge: "小游戏入口",
      tone: "game",
      accentColor: "#6655d8",
      headline: activity.title,
      scene: "屏幕前的短暂叛逃，手指负责把大脑带离工位。",
      prompt: activity.description,
      statLabel: "手眼协调",
      statValue
    };
  }
  if (activity.category === "rest") {
    return {
      badge: "精神离线",
      tone: "calm",
      accentColor: "#1f8f62",
      headline: activity.title,
      scene: "把注意力从消息红点里拽出来，给自己留一小块静音区。",
      prompt: activity.description,
      statLabel: "回血概率",
      statValue
    };
  }
  if (activity.category === "physical") {
    return {
      badge: "身体重启",
      tone: "physical",
      accentColor: "#b9821f",
      headline: activity.title,
      scene: "椅子已经连续获胜太久，现在轮到身体拿回一点控制权。",
      prompt: activity.description,
      statLabel: "关节上线",
      statValue
    };
  }
  if (activity.category === "imagination") {
    return {
      badge: "脑洞逃逸",
      tone: "daydream",
      accentColor: "#2d7d90",
      headline: activity.title,
      scene: "现实先放旁边，给脑内小剧场批准一张临时通行证。",
      prompt: activity.description,
      statLabel: "离谱指数",
      statValue
    };
  }
  return {
    badge: "工位表演",
    tone: "absurd",
    accentColor: "#8b4d36",
    headline: activity.title,
    scene: "这是一场不需要观众的办公室独幕剧，表演结束就能继续装忙。",
    prompt: activity.description,
    statLabel: "戏剧张力",
    statValue
  };
}

export function fallbackActivityStatValue(seed: string, difficulty: string): string {
  const base = difficulty === "hard" ? 70 : difficulty === "normal" ? 55 : 40;
  const hash = [...seed].reduce((total, char) => total + char.charCodeAt(0), 0);
  return `${Math.min(96, base + (hash % 22))}%`;
}

export type ActivityDisplayState =
  | { kind: "empty" }
  | { kind: "unavailable" }
  | { kind: "active-incomplete"; canComplete: false }
  | { kind: "active-ready"; canComplete: true }
  | { kind: "completed" }
  | { kind: "skipped" };

export function deriveActivityDisplayState(
  assignment: ActivityAssignment | null,
  progress: ActivityInteractionProgress,
  unavailable: boolean
): ActivityDisplayState {
  if (!assignment) {
    return unavailable ? { kind: "unavailable" } : { kind: "empty" };
  }
  if (assignment.status === "completed") {
    return { kind: "completed" };
  }
  if (assignment.status === "skipped") {
    return { kind: "skipped" };
  }
  const complete = isActivityInteractionComplete(assignment, progress);
  return complete
    ? { kind: "active-ready", canComplete: true }
    : { kind: "active-incomplete", canComplete: false };
}

export function isActivityInteractionComplete(
  assignment: ActivityAssignment,
  progress: ActivityInteractionProgress
): boolean {
  return assignment.interaction.steps
    .filter((step) => step.required)
    .every((step) => isActivityStepComplete(step, progress));
}

export function activityStepTypeLabel(type: string): string {
  if (type === "timer") return "倒计时";
  if (type === "choice") return "选择";
  if (type === "mini_game") return "小游戏";
  if (type === "tap-pattern") return "点击";
  if (type === "shuffle-pick") return "抽取";
  if (type === "sort") return "排序";
  if (type === "breath") return "呼吸";
  if (type === "reaction") return "反应";
  if (type === "micro-journal") return "记录";
  if (type === "reveal") return "翻开";
  return "确认";
}

export function activityInteractionSummaryLabel(
  summary: ActivityCatalog["items"][number]["interactionSummary"]
): string {
  const traits = [
    summary.hasTimer ? "倒计时" : null,
    summary.hasChoice ? "选择题" : null,
    summary.hasMiniGame ? "小游戏" : null,
    summary.hasTapPattern ? "点击" : null,
    summary.hasShufflePick ? "抽取" : null,
    summary.hasSort ? "排序" : null,
    summary.hasBreath ? "呼吸" : null,
    summary.hasReaction ? "反应" : null,
    summary.hasMicroJournal ? "记录" : null,
    summary.hasReveal ? "翻开" : null
  ].filter(Boolean);
  const summaryText = `${summary.stepCount} 步 · 约 ${summary.estimatedSeconds} 秒${
    traits.length ? ` · ${traits.join("/")}` : ""
  }`;
  return summary.flavorLabel ? `${summary.flavorLabel} · ${summaryText}` : summaryText;
}

export function achievementCategoryLabel(category: string): string {
  return (
    {
      new_user: "新手",
      check_in: "打卡",
      activity: "活动",
      bean_draw: "抽豆",
      leaderboard: "排行",
      social: "社交"
    }[category] ?? category
  );
}

export function achievementProgressLabel(progress: {
  current: number;
  target: number;
  unit: string;
}): string {
  if (progress.unit === "minutes") return `${progress.current}/${progress.target} 分钟`;
  if (progress.unit === "days") return `${progress.current}/${progress.target} 天`;
  if (progress.unit === "rank") {
    return progress.current > 0
      ? `第 ${progress.current}/前 ${progress.target}`
      : `未上榜/前 ${progress.target}`;
  }
  return `${progress.current}/${progress.target}`;
}

export function findGoal(
  progression: ProgressionSummary | null,
  code: "check_in" | "activity" | "bean_draw"
) {
  return progression?.dailyGoals.goals.find((goal) => goal.code === code) ?? null;
}

export function pickAchievementFocus(list: AchievementList | null): AchievementRecommendation | null {
  if (!list) return null;
  return (
    list.recommendations.today[0] ??
    list.recommendations.nearest[0] ??
    list.recommendations.long_term[0] ??
    null
  );
}

export function achievementTargetTab(achievement: AchievementRecommendation): DashboardTab {
  if (achievement.targetSection === "leaderboards") {
    return "rankings";
  }
  return achievement.targetSection;
}

export function getLeaderboardPodium(
  leaderboard: LeaderboardResponse | null
): LeaderboardResponse["items"] {
  if (!leaderboard?.items.length) return [];
  const ordered = [leaderboard.items[1], leaderboard.items[0], leaderboard.items[2]].filter(
    Boolean
  );
  if (leaderboard.items.length === 1) {
    return [leaderboard.items[0]];
  }
  return ordered;
}

export function getLeaderboardList(
  leaderboard: LeaderboardResponse | null
): LeaderboardResponse["items"] {
  return leaderboard?.items.slice(3) ?? [];
}

export function isLeaderboardCurrentUser(
  item: LeaderboardResponse["items"][number],
  currentUser: LeaderboardResponse["currentUser"]
): boolean {
  return !!item.userId && item.userId === currentUser?.userId;
}

export const leaderboardWindows: Array<{ value: LeaderboardWindow; label: string }> = [
  { value: "daily", label: "日榜" },
  { value: "weekly", label: "周榜" },
  { value: "monthly", label: "月榜" },
  { value: "all_time", label: "总榜" }
];

export const leaderboardScopes: Array<{ value: LeaderboardScope; label: string }> = [
  { value: "global", label: "全站" },
  { value: "friends", label: "好友" },
  { value: "squad", label: "小队" },
  { value: "company", label: "公司" }
];

export const activityCategories: ActivityCategory[] = [
  "rest",
  "game",
  "office_theater",
  "physical",
  "imagination"
];

export const achievementCategories: Achievement["category"][] = [
  "new_user",
  "check_in",
  "activity",
  "bean_draw",
  "leaderboard",
  "social"
];

export const activitySkipReasonOptions: Array<{ value: ActivitySkipReason; label: string }> = [
  { value: "not_interested", label: "没兴趣" },
  { value: "too_much_work", label: "太麻烦" },
  { value: "not_convenient", label: "不方便" },
  { value: "want_weirder", label: "来点怪的" },
  { value: "other", label: "换个口味" }
];

export const beanThemes: BeanTheme[] = ["office", "restroom", "daydream"];
export const beanRarities = ["common", "uncommon", "rare", "epic", "legendary"] as const;
