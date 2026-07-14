import type { DashboardTab } from "../../gameplay/dashboardTabs";

export type DashboardTabMode<T extends DashboardTab = DashboardTab> =
  T extends "home" ? "today" :
  T extends "activities" ? "play" | "history" :
  T extends "beans" ? "tank" | "draw" | "collection" :
  T extends "rankings" ? "ranking" | "social" :
  T extends "profile" ? "overview" | "achievements" | "rewards" :
  never;

export type AnyDashboardMode = DashboardTabMode<DashboardTab>;

export type ModeDefinition<T extends DashboardTab = DashboardTab> = {
  value: DashboardTabMode<T>;
  label: string;
  primary: boolean;
};

export const homeModes: ModeDefinition<"home">[] = [
  { value: "today", label: "今天", primary: true }
];

export const activitiesModes: ModeDefinition<"activities">[] = [
  { value: "play", label: "任务", primary: true },
  { value: "history", label: "记录", primary: false }
];

export const beansModes: ModeDefinition<"beans">[] = [
  { value: "tank", label: "鱼缸", primary: true },
  { value: "draw", label: "抽豆", primary: false },
  { value: "collection", label: "收藏", primary: false }
];

export const rankingsModes: ModeDefinition<"rankings">[] = [
  { value: "ranking", label: "排行", primary: true },
  { value: "social", label: "社交", primary: false }
];

export const profileModes: ModeDefinition<"profile">[] = [
  { value: "overview", label: "总览", primary: true },
  { value: "achievements", label: "成就", primary: false },
  { value: "rewards", label: "奖励", primary: false }
];

export function tabModeDefinitions<T extends DashboardTab>(tab: T): ModeDefinition<T>[] {
  switch (tab) {
    case "home":
      return homeModes as ModeDefinition<T>[];
    case "activities":
      return activitiesModes as ModeDefinition<T>[];
    case "beans":
      return beansModes as ModeDefinition<T>[];
    case "rankings":
      return rankingsModes as ModeDefinition<T>[];
    case "profile":
      return profileModes as ModeDefinition<T>[];
    default:
      return [];
  }
}

export function defaultModeForTab<T extends DashboardTab>(tab: T): DashboardTabMode<T> {
  const primary = tabModeDefinitions(tab).find((item) => item.primary);
  return (primary?.value ?? "today") as DashboardTabMode<T>;
}

export function isValidModeForTab<T extends DashboardTab>(
  tab: T,
  mode: AnyDashboardMode
): mode is DashboardTabMode<T> {
  return tabModeDefinitions(tab).some((item) => item.value === mode);
}

export function resolveModeForTab<T extends DashboardTab>(
  tab: T,
  mode: AnyDashboardMode | undefined
): DashboardTabMode<T> {
  if (mode && isValidModeForTab(tab, mode)) return mode;
  return defaultModeForTab(tab);
}

export function modeLabel(mode: AnyDashboardMode): string {
  const all = [
    ...homeModes,
    ...activitiesModes,
    ...beansModes,
    ...rankingsModes,
    ...profileModes
  ];
  return all.find((item) => item.value === mode)?.label ?? mode;
}

export type DashboardSemanticAnchor =
  | "top"
  | "current-activity"
  | "activity-history"
  | "fish-tank"
  | "draw"
  | "draw-result"
  | "bean-collection"
  | "ranking"
  | "social"
  | "achievement"
  | "cosmetic";

export type DashboardSemanticDestination = {
  tab: DashboardTab;
  mode?: AnyDashboardMode;
  anchor?: DashboardSemanticAnchor;
};

export function anchorOwningMode(anchor: DashboardSemanticAnchor): AnyDashboardMode | undefined {
  switch (anchor) {
    case "current-activity":
      return "play";
    case "activity-history":
      return "history";
    case "fish-tank":
      return "tank";
    case "draw":
    case "draw-result":
      return "draw";
    case "bean-collection":
      return "collection";
    case "ranking":
      return "ranking";
    case "social":
      return "social";
    case "achievement":
      return "achievements";
    case "cosmetic":
      return "rewards";
    case "top":
    default:
      return undefined;
  }
}

export function resolveSemanticDestination(
  input: Partial<DashboardSemanticDestination> & { tab: DashboardTab }
): Required<Pick<DashboardSemanticDestination, "tab" | "mode">> & { anchor: DashboardSemanticAnchor } {
  const anchor = input.anchor ?? "top";
  const fallback = {
    tab: input.tab,
    mode: defaultModeForTab(input.tab),
    anchor: "top" as const
  };
  if (input.mode && !isValidModeForTab(input.tab, input.mode)) return fallback;

  const anchorMode = anchorOwningMode(anchor);
  if (anchorMode && !isValidModeForTab(input.tab, anchorMode)) return fallback;
  if (input.mode && anchorMode && input.mode !== anchorMode) return fallback;

  const requestedMode = input.mode ?? anchorMode;
  const mode = resolveModeForTab(input.tab, requestedMode);
  return { tab: input.tab, mode, anchor };
}

export function isAnchorOwnedByMode(
  anchor: DashboardSemanticAnchor,
  mode: AnyDashboardMode
): boolean {
  return anchorOwningMode(anchor) === mode;
}

export type DashboardDurableResultKind =
  | "check-in"
  | "progression-claim"
  | "activity"
  | "bean-draw"
  | "hatch"
  | "equip-decoration"
  | "social-reaction"
  | "cosmetic-equip"
  | "achievement-unlock";

export function resultOwningMode(
  kind: DashboardDurableResultKind
): { tab: DashboardTab; mode: AnyDashboardMode } {
  switch (kind) {
    case "check-in":
    case "progression-claim":
      return { tab: "home", mode: "today" };
    case "activity":
      return { tab: "activities", mode: "play" };
    case "bean-draw":
      return { tab: "beans", mode: "draw" };
    case "hatch":
    case "equip-decoration":
      return { tab: "beans", mode: "tank" };
    case "social-reaction":
      return { tab: "rankings", mode: "ranking" };
    case "cosmetic-equip":
      return { tab: "profile", mode: "rewards" };
    case "achievement-unlock":
      return { tab: "profile", mode: "achievements" };
  }
}

export function isResultOwnedByMode(
  kind: DashboardDurableResultKind,
  tab: DashboardTab,
  mode: AnyDashboardMode
): boolean {
  const owner = resultOwningMode(kind);
  return owner.tab === tab && owner.mode === mode;
}

export type DashboardFeedbackScope = DashboardTab | "global" | `${DashboardTab}:${AnyDashboardMode}`;

export function dashboardFeedbackScope(
  tab: DashboardTab,
  mode?: AnyDashboardMode
): DashboardFeedbackScope {
  return mode ? `${tab}:${mode}` : tab;
}

export function parseDashboardFeedbackScope(
  scope: DashboardFeedbackScope
): { tab: DashboardTab | "global"; mode?: AnyDashboardMode } {
  if (scope === "global") return { tab: "global" };
  const parts = scope.split(":") as [DashboardTab, AnyDashboardMode] | [DashboardTab];
  if (parts.length === 2) return { tab: parts[0], mode: parts[1] };
  return { tab: parts[0] };
}

export function scopeMatchesTabAndMode(
  scope: DashboardFeedbackScope,
  tab: DashboardTab,
  mode?: AnyDashboardMode
): boolean {
  if (scope === "global") return true;
  const parsed = parseDashboardFeedbackScope(scope);
  if (parsed.tab !== tab) return false;
  if (!parsed.mode) return true;
  return parsed.mode === mode;
}

export function isNavigationOnlyControl(action?: DashboardSemanticDestination): boolean {
  if (!action) return false;
  return true;
}

export type DashboardNavigationPlan = {
  destinationTab: DashboardTab;
  mode: AnyDashboardMode;
  anchor: DashboardSemanticAnchor;
  clearScope: DashboardTab;
  clearMode?: AnyDashboardMode;
  reselect: boolean;
};

export function planSemanticDashboardNavigation(input: {
  currentTab: DashboardTab;
  currentMode?: AnyDashboardMode;
  destination: Partial<DashboardSemanticDestination> & { tab: DashboardTab };
}): DashboardNavigationPlan {
  const resolved = resolveSemanticDestination(input.destination);
  return {
    destinationTab: resolved.tab,
    mode: resolved.mode,
    anchor: resolved.anchor,
    clearScope: input.currentTab,
    clearMode: input.currentMode,
    reselect: input.currentTab === resolved.tab
  };
}
