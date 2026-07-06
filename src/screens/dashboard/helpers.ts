import type {
  Achievement,
  AchievementList,
  AchievementRecommendation
} from "../../api/achievements";
import type {
  ActivityAssignment,
  ActivityCatalog,
  ActivityCategory,
  ActivityInteractionProgress,
  ActivityPresentation,
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
