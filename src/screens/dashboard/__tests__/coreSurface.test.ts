import { describe, expect, it } from "vitest";
import {
  activitiesModes,
  anchorOwningMode,
  beansModes,
  dashboardFeedbackScope,
  defaultModeForTab,
  homeModes,
  isAnchorOwnedByMode,
  isNavigationOnlyControl,
  isResultOwnedByMode,
  isValidModeForTab,
  modeLabel,
  parseDashboardFeedbackScope,
  planSemanticDashboardNavigation,
  profileModes,
  rankingsModes,
  resolveModeForTab,
  resolveSemanticDestination,
  resultOwningMode,
  scopeMatchesTabAndMode,
  tabModeDefinitions
} from "../coreSurface";
import type { DashboardTab } from "../../../gameplay/dashboardTabs";

describe("mode registries", () => {
  it("defines exactly one primary mode per tab", () => {
    expect(homeModes.filter((m) => m.primary).map((m) => m.value)).toEqual(["today"]);
    expect(activitiesModes.filter((m) => m.primary).map((m) => m.value)).toEqual(["play"]);
    expect(beansModes.filter((m) => m.primary).map((m) => m.value)).toEqual(["tank"]);
    expect(rankingsModes.filter((m) => m.primary).map((m) => m.value)).toEqual(["ranking"]);
    expect(profileModes.filter((m) => m.primary).map((m) => m.value)).toEqual(["overview"]);
  });

  it("exposes stable secondary modes", () => {
    expect(activitiesModes.map((m) => m.value)).toEqual(["play", "history"]);
    expect(beansModes.map((m) => m.value)).toEqual(["tank", "draw", "collection"]);
    expect(rankingsModes.map((m) => m.value)).toEqual(["ranking", "social"]);
    expect(profileModes.map((m) => m.value)).toEqual(["overview", "achievements", "rewards"]);
  });

  it("provides localized labels", () => {
    expect(modeLabel("today")).toBe("今天");
    expect(modeLabel("play")).toBe("任务");
    expect(modeLabel("history")).toBe("记录");
    expect(modeLabel("tank")).toBe("鱼缸");
    expect(modeLabel("draw")).toBe("抽豆");
    expect(modeLabel("collection")).toBe("收藏");
    expect(modeLabel("ranking")).toBe("排行");
    expect(modeLabel("social")).toBe("社交");
    expect(modeLabel("overview")).toBe("总览");
    expect(modeLabel("achievements")).toBe("成就");
    expect(modeLabel("rewards")).toBe("奖励");
  });

  it("returns mode definitions by tab", () => {
    expect(tabModeDefinitions("home").map((m) => m.value)).toEqual(["today"]);
    expect(tabModeDefinitions("activities").map((m) => m.value)).toEqual(["play", "history"]);
    expect(tabModeDefinitions("beans").map((m) => m.value)).toEqual(["tank", "draw", "collection"]);
    expect(tabModeDefinitions("rankings").map((m) => m.value)).toEqual(["ranking", "social"]);
    expect(tabModeDefinitions("profile").map((m) => m.value)).toEqual(["overview", "achievements", "rewards"]);
  });
});

describe("default and resolved modes", () => {
  it("returns the primary mode as default", () => {
    expect(defaultModeForTab("home")).toBe("today");
    expect(defaultModeForTab("activities")).toBe("play");
    expect(defaultModeForTab("beans")).toBe("tank");
    expect(defaultModeForTab("rankings")).toBe("ranking");
    expect(defaultModeForTab("profile")).toBe("overview");
  });

  it("validates modes that belong to the tab", () => {
    expect(isValidModeForTab("beans", "tank")).toBe(true);
    expect(isValidModeForTab("beans", "play")).toBe(false);
    expect(isValidModeForTab("activities", "history")).toBe(true);
    expect(isValidModeForTab("profile", "rewards")).toBe(true);
    expect(isValidModeForTab("rankings", "overview")).toBe(false);
  });

  it("resolves valid modes and falls back to primary for invalid or missing modes", () => {
    expect(resolveModeForTab("beans", "draw")).toBe("draw");
    expect(resolveModeForTab("beans", "invalid" as never)).toBe("tank");
    expect(resolveModeForTab("beans", undefined)).toBe("tank");
    expect(resolveModeForTab("profile", "achievements")).toBe("achievements");
    expect(resolveModeForTab("profile", "tank" as never)).toBe("overview");
  });
});

describe("semantic destination resolution", () => {
  it("resolves tab-only input to primary mode and top anchor", () => {
    expect(resolveSemanticDestination({ tab: "beans" })).toEqual({
      tab: "beans",
      mode: "tank",
      anchor: "top"
    });
  });

  it("resolves explicit modes", () => {
    expect(resolveSemanticDestination({ tab: "activities", mode: "history" })).toEqual({
      tab: "activities",
      mode: "history",
      anchor: "top"
    });
  });

  it("derives mode from anchor when mode is omitted", () => {
    expect(resolveSemanticDestination({ tab: "beans", anchor: "draw-result" })).toEqual({
      tab: "beans",
      mode: "draw",
      anchor: "draw-result"
    });
    expect(resolveSemanticDestination({ tab: "profile", anchor: "achievement" })).toEqual({
      tab: "profile",
      mode: "achievements",
      anchor: "achievement"
    });
  });

  it("falls back to primary mode when requested mode is invalid for the tab", () => {
    expect(resolveSemanticDestination({ tab: "home", mode: "draw" as never })).toEqual({
      tab: "home",
      mode: "today",
      anchor: "top"
    });
  });

  it("falls back safely when anchor does not belong to the tab", () => {
    expect(resolveSemanticDestination({ tab: "home", anchor: "fish-tank" })).toEqual({
      tab: "home",
      mode: "today",
      anchor: "top"
    });
  });

  it("falls back when explicit mode and anchor disagree", () => {
    expect(resolveSemanticDestination({ tab: "beans", mode: "collection", anchor: "draw-result" })).toEqual({
      tab: "beans",
      mode: "tank",
      anchor: "top"
    });
  });
});

describe("anchor ownership", () => {
  it("maps anchors to their owning modes", () => {
    expect(anchorOwningMode("current-activity")).toBe("play");
    expect(anchorOwningMode("activity-history")).toBe("history");
    expect(anchorOwningMode("fish-tank")).toBe("tank");
    expect(anchorOwningMode("draw")).toBe("draw");
    expect(anchorOwningMode("draw-result")).toBe("draw");
    expect(anchorOwningMode("bean-collection")).toBe("collection");
    expect(anchorOwningMode("ranking")).toBe("ranking");
    expect(anchorOwningMode("social")).toBe("social");
    expect(anchorOwningMode("achievement")).toBe("achievements");
    expect(anchorOwningMode("cosmetic")).toBe("rewards");
    expect(anchorOwningMode("top")).toBeUndefined();
  });

  it("detects when an anchor belongs to a mode", () => {
    expect(isAnchorOwnedByMode("draw-result", "draw")).toBe(true);
    expect(isAnchorOwnedByMode("draw-result", "tank")).toBe(false);
    expect(isAnchorOwnedByMode("top", "today")).toBe(false);
  });
});

describe("result ownership", () => {
  it("maps durable results to their owning tab and mode", () => {
    expect(resultOwningMode("check-in")).toEqual({ tab: "home", mode: "today" });
    expect(resultOwningMode("progression-claim")).toEqual({ tab: "home", mode: "today" });
    expect(resultOwningMode("activity")).toEqual({ tab: "activities", mode: "play" });
    expect(resultOwningMode("bean-draw")).toEqual({ tab: "beans", mode: "draw" });
    expect(resultOwningMode("hatch")).toEqual({ tab: "beans", mode: "tank" });
    expect(resultOwningMode("equip-decoration")).toEqual({ tab: "beans", mode: "tank" });
    expect(resultOwningMode("social-reaction")).toEqual({ tab: "rankings", mode: "ranking" });
    expect(resultOwningMode("cosmetic-equip")).toEqual({ tab: "profile", mode: "rewards" });
    expect(resultOwningMode("achievement-unlock")).toEqual({ tab: "profile", mode: "achievements" });
  });

  it("checks result ownership against a tab/mode pair", () => {
    expect(isResultOwnedByMode("bean-draw", "beans", "draw")).toBe(true);
    expect(isResultOwnedByMode("bean-draw", "beans", "tank")).toBe(false);
    expect(isResultOwnedByMode("hatch", "beans", "tank")).toBe(true);
    expect(isResultOwnedByMode("progression-claim", "home", "today")).toBe(true);
  });
});

describe("feedback scope helpers", () => {
  it("builds tab and tab+mode scopes", () => {
    expect(dashboardFeedbackScope("home")).toBe("home");
    expect(dashboardFeedbackScope("home", "today")).toBe("home:today");
    expect(dashboardFeedbackScope("beans", "draw")).toBe("beans:draw");
  });

  it("parses scopes back into tab and optional mode", () => {
    expect(parseDashboardFeedbackScope("global")).toEqual({ tab: "global" });
    expect(parseDashboardFeedbackScope("home")).toEqual({ tab: "home" });
    expect(parseDashboardFeedbackScope("beans:draw")).toEqual({ tab: "beans", mode: "draw" });
  });

  it("matches global scope to every tab and mode", () => {
    expect(scopeMatchesTabAndMode("global", "home", "today")).toBe(true);
    expect(scopeMatchesTabAndMode("global", "beans", "draw")).toBe(true);
  });

  it("matches tab-level scope to any mode in that tab", () => {
    expect(scopeMatchesTabAndMode("beans", "beans", "tank")).toBe(true);
    expect(scopeMatchesTabAndMode("beans", "beans", "draw")).toBe(true);
    expect(scopeMatchesTabAndMode("beans", "home", "today")).toBe(false);
  });

  it("matches mode-level scope only to the same tab and mode", () => {
    expect(scopeMatchesTabAndMode("beans:draw", "beans", "draw")).toBe(true);
    expect(scopeMatchesTabAndMode("beans:draw", "beans", "tank")).toBe(false);
    expect(scopeMatchesTabAndMode("beans:draw", "home", "today")).toBe(false);
  });
});

describe("semantic navigation planning", () => {
  it("plans different-tab selection to the destination primary mode", () => {
    const plan = planSemanticDashboardNavigation({
      currentTab: "home",
      currentMode: "today",
      destination: { tab: "beans" }
    });
    expect(plan).toMatchObject({
      destinationTab: "beans",
      mode: "tank",
      anchor: "top",
      clearScope: "home",
      clearMode: "today",
      reselect: false
    });
  });

  it("plans active-tab reselection back to primary mode and top", () => {
    const plan = planSemanticDashboardNavigation({
      currentTab: "beans",
      currentMode: "draw",
      destination: { tab: "beans" }
    });
    expect(plan).toMatchObject({
      destinationTab: "beans",
      mode: "tank",
      anchor: "top",
      reselect: true
    });
  });

  it("plans local mode selection without changing tab", () => {
    const plan = planSemanticDashboardNavigation({
      currentTab: "beans",
      currentMode: "tank",
      destination: { tab: "beans", mode: "draw" }
    });
    expect(plan).toMatchObject({
      destinationTab: "beans",
      mode: "draw",
      anchor: "top",
      clearScope: "beans",
      clearMode: "tank",
      reselect: true
    });
  });

  it("plans anchor landing through the owning mode", () => {
    const plan = planSemanticDashboardNavigation({
      currentTab: "home",
      destination: { tab: "activities", anchor: "current-activity" }
    });
    expect(plan).toMatchObject({
      destinationTab: "activities",
      mode: "play",
      anchor: "current-activity",
      reselect: false
    });
  });
});

describe("navigation-only controls", () => {
  it("treats semantic destinations as navigation-only", () => {
    expect(isNavigationOnlyControl({ tab: "beans", mode: "draw" })).toBe(true);
    expect(isNavigationOnlyControl({ tab: "profile", anchor: "achievement" })).toBe(true);
  });
});
