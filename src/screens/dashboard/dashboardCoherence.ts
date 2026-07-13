import type { BeanDrawResult } from "../../api/beans";
import type { ActivityCompleteResult } from "../../api/activities";
import type { CheckInFinishResult } from "../../api/checkins";
import type { DashboardTab } from "../../gameplay/dashboardTabs";

export type DashboardLandingTarget =
  | "top"
  | "fish-tank"
  | "draw-result"
  | "current-activity";

export type DashboardFeedbackKind = "success" | "error" | "info";

export type DashboardFeedback = {
  id: string;
  kind: DashboardFeedbackKind;
  scope: DashboardTab | "global";
  message: string;
  autoDismiss: boolean;
};

export type DashboardApiError = {
  code: string;
  message: string;
  requestId?: string;
  traceId?: string;
};

export type DashboardActionExecution = "navigate" | "mutate";
export type LatestLoopResult = "check-in" | "activity" | "bean-draw" | null;

export const fishTankInventoryFollowUp = {
  execution: "navigate" as const,
  tab: "beans" as const,
  target: "fish-tank" as const
};

export const DASHBOARD_FEEDBACK_TIMEOUT_MS = 4500;

const errorCopy: Record<string, string> = {
  NETWORK_ERROR: "网络开小差了，请稍后重试。",
  INVALID_RESPONSE: "服务返回了无法识别的结果，请稍后重试。",
  UNAUTHORIZED: "登录状态已失效，请重新登录。",
  FORBIDDEN: "当前操作暂时不可用。",
  NOT_FOUND: "没有找到对应内容。",
  RATE_LIMITED: "操作有点频繁，稍后再试。",
  FRIEND_CODE_NOT_FOUND: "没有找到这个好友码。",
  SELF_FRIENDSHIP: "不能添加自己为好友。",
  TANK_NOT_INITIALIZED: "请先开启个人鱼缸。",
  UNSUPPORTED_INTERACTION: "当前鱼缸互动暂不支持。",
  INTERACTION_COOLDOWN: "小鱼正在休息，稍后再互动。",
  INSUFFICIENT_HATCH_PROGRESS: "孵化进度还不够。",
  FISH_CATALOG_COMPLETE: "当前小鱼图鉴已经集齐。",
  DECORATION_LOCKED: "这件装扮还没有解锁。",
  WRONG_DECORATION_SLOT: "这件装扮不能装备到这个位置。",
  INVALID_IDEMPOTENCY_KEY: "本次操作凭证无效，请重试。",
  IDEMPOTENCY_KEY_REUSED: "本次操作已经用于其他请求，请重试。"
};

const unitCopy: Record<string, string> = {
  times: "次",
  minutes: "分钟",
  days: "天"
};

export function createDashboardFeedback(input: {
  id: string;
  kind: DashboardFeedbackKind;
  scope: DashboardFeedback["scope"];
  message: string;
}): DashboardFeedback {
  return {
    ...input,
    autoDismiss: input.kind !== "error"
  };
}

export function visibleDashboardFeedback(
  feedback: DashboardFeedback | null,
  tab: DashboardTab
): DashboardFeedback | null {
  if (!feedback) return null;
  return feedback.scope === "global" || feedback.scope === tab ? feedback : null;
}

export function clearFeedbackForScope(
  feedback: DashboardFeedback | null,
  scope: DashboardTab
): DashboardFeedback | null {
  if (!feedback || feedback.scope !== scope) return feedback;
  return null;
}

export function replaceFeedbackForScope(
  feedback: DashboardFeedback[],
  next: DashboardFeedback
): DashboardFeedback[] {
  return [...feedback.filter((item) => item.scope !== next.scope), next];
}

export function clearFeedbackListForScope(
  feedback: DashboardFeedback[],
  scope: DashboardTab
): DashboardFeedback[] {
  return feedback.filter((item) => item.scope !== scope);
}

export function visibleDashboardFeedbackFromList(
  feedback: DashboardFeedback[],
  tab: DashboardTab
): DashboardFeedback | null {
  const scoped = feedback.find((item) => item.scope === tab);
  if (scoped) return scoped;
  return feedback.find((item) => item.scope === "global") ?? null;
}

export function localizedGoalUnit(unit: string): string {
  return unitCopy[unit] ?? unit;
}

export function localizedApiError(
  error: DashboardApiError | null | undefined,
  fallback = "操作没有成功，请稍后重试。"
): string {
  if (!error) return fallback;
  return errorCopy[error.code] ?? fallback;
}

export function shouldRefreshFishTankAfterDraw(
  result: BeanDrawResult | null | undefined
): boolean {
  return Boolean(result?.fishTankOutcomes?.length);
}

export function resolveLandingOffset(
  target: DashboardLandingTarget,
  offsets: Partial<Record<DashboardLandingTarget, number>>
): number {
  if (target === "top") return 0;
  return offsets[target] ?? 0;
}

export function planDashboardNavigation(input: {
  currentTab: DashboardTab;
  destinationTab: DashboardTab;
  target: DashboardLandingTarget;
  offsets: Partial<Record<DashboardLandingTarget, number>>;
}) {
  const targetAvailable =
    input.target === "top" || input.offsets[input.target] !== undefined;
  return {
    clearScope: input.currentTab,
    destinationTab: input.destinationTab,
    target: input.target,
    offset: resolveLandingOffset(input.target, input.offsets),
    reselect: input.currentTab === input.destinationTab,
    waitForTarget: input.target !== "top" && !targetAvailable
  };
}

export function expireDashboardFeedback(
  current: DashboardFeedback | null,
  expectedId: string
): DashboardFeedback | null {
  return current?.id === expectedId ? null : current;
}

export function expireDashboardFeedbackFromList(
  current: DashboardFeedback[],
  expectedId: string
): DashboardFeedback[] {
  return current.filter((item) => item.id !== expectedId);
}

export function directActionLabel(input: {
  execution: DashboardActionExecution;
  label: string;
  kind: string;
}): string {
  if (input.execution === "navigate") return input.label;
  if (input.kind === "bean-draw" && input.label === "立即抽豆") return "立即抽取 1 次";
  if (input.kind === "goal-reward" && input.label === "领奖励") return "领取成长奖励";
  return input.label;
}

export async function runSingleFlight(
  gate: { current: boolean },
  action: () => void | Promise<void>
): Promise<boolean> {
  if (gate.current) return false;
  gate.current = true;
  try {
    await action();
    return true;
  } finally {
    gate.current = false;
  }
}

export async function synchronizeFishTankAfterBeanDraw(
  result: BeanDrawResult | null | undefined,
  refreshFishTank: () => Promise<boolean>
): Promise<"not-required" | "current" | "stale"> {
  if (!shouldRefreshFishTankAfterDraw(result)) return "not-required";
  return (await refreshFishTank()) ? "current" : "stale";
}

export function selectLatestLoopResults(
  latest: LatestLoopResult,
  results: {
    lastResult: CheckInFinishResult | null;
    activityResult: ActivityCompleteResult | null;
    beanDrawResult: BeanDrawResult | null;
  }
) {
  return {
    lastResult: latest === "check-in" ? results.lastResult : null,
    activityResult: latest === "activity" ? results.activityResult : null,
    beanDrawResult: latest === "bean-draw" ? results.beanDrawResult : null
  };
}
