import { describe, expect, it } from "vitest";
import {
  clearFeedbackForScope,
  clearFeedbackListForScope,
  createDashboardFeedback,
  directActionLabel,
  expireDashboardFeedback,
  expireDashboardFeedbackFromList,
  fishTankInventoryFollowUp,
  localizedApiError,
  localizedGoalUnit,
  planDashboardNavigation,
  replaceFeedbackForScope,
  resolveLandingOffset,
  runSingleFlight,
  selectLatestLoopResults,
  shouldRefreshFishTankAfterDraw,
  synchronizeFishTankAfterBeanDraw,
  hasFishTankOutcomes,
  synchronizeFishTankAfterReward,
  visibleDashboardFeedback,
  visibleDashboardFeedbackFromList
} from "../dashboardCoherence";
import { dashboardTabs } from "../../../gameplay/dashboardTabs";

describe("dashboard landing", () => {
  it("keeps fixtures for all five primary destinations", () => {
    expect(dashboardTabs.map((tab) => tab.value)).toEqual([
      "home",
      "activities",
      "beans",
      "rankings",
      "profile"
    ]);
  });
  it("uses semantic offsets and falls back safely to top", () => {
    expect(resolveLandingOffset("fish-tank", { "fish-tank": 120 })).toBe(120);
    expect(resolveLandingOffset("draw-result", {})).toBe(0);
    expect(resolveLandingOffset("top", { top: 99 })).toBe(0);
  });

  it("plans different-tab and active-tab selections deterministically", () => {
    const different = planDashboardNavigation({
      currentTab: "home",
      destinationTab: "beans",
      target: "fish-tank",
      offsets: { "fish-tank": 240 }
    });
    expect(different).toMatchObject({ clearScope: "home", offset: 240, reselect: false, waitForTarget: false });
    const reselect = planDashboardNavigation({
      currentTab: "beans",
      destinationTab: "beans",
      target: "top",
      offsets: {}
    });
    expect(reselect).toMatchObject({ offset: 0, reselect: true });
  });

  it("waits for delayed targets and safely uses top until they exist", () => {
    const delayed = planDashboardNavigation({
      currentTab: "home",
      destinationTab: "activities",
      target: "current-activity",
      offsets: {}
    });
    expect(delayed).toMatchObject({ offset: 0, waitForTarget: true });
    expect(
      planDashboardNavigation({
        currentTab: "activities",
        destinationTab: "activities",
        target: "current-activity",
        offsets: { "current-activity": 318 }
      })
    ).toMatchObject({ offset: 318, waitForTarget: false });
  });
});

describe("scoped dashboard feedback", () => {
  it("auto-dismisses non-errors but keeps errors persistent", () => {
    expect(createDashboardFeedback({ id: "1", kind: "success", scope: "home", message: "ok" }).autoDismiss).toBe(true);
    expect(createDashboardFeedback({ id: "2", kind: "error", scope: "home", message: "no" }).autoDismiss).toBe(false);
  });

  it("isolates feedback by tab and supports scoped clearing", () => {
    const feedback = createDashboardFeedback({ id: "1", kind: "error", scope: "rankings", message: "no" });
    expect(visibleDashboardFeedback(feedback, "rankings")).toBe(feedback);
    expect(visibleDashboardFeedback(feedback, "profile")).toBeNull();
    expect(clearFeedbackForScope(feedback, "profile")).toBe(feedback);
    expect(clearFeedbackForScope(feedback, "rankings")).toBeNull();
  });

  it("shows global feedback in every tab", () => {
    const feedback = createDashboardFeedback({ id: "1", kind: "info", scope: "global", message: "hi" });
    expect(visibleDashboardFeedback(feedback, "home")).toBe(feedback);
    expect(visibleDashboardFeedback(feedback, "beans")).toBe(feedback);
  });

  it("expires only the feedback instance that scheduled the timer", () => {
    const oldFeedback = createDashboardFeedback({ id: "old", kind: "success", scope: "home", message: "old" });
    const replacement = createDashboardFeedback({ id: "new", kind: "success", scope: "home", message: "new" });
    expect(expireDashboardFeedback(oldFeedback, "old")).toBeNull();
    expect(expireDashboardFeedback(replacement, "old")).toBe(replacement);
  });

  it("keeps unrelated scopes when concurrent requests replace feedback", () => {
    const homeError = createDashboardFeedback({ id: "home", kind: "error", scope: "home", message: "home failed" });
    const rankingError = createDashboardFeedback({ id: "ranking", kind: "error", scope: "rankings", message: "ranking failed" });
    const feedback = replaceFeedbackForScope(replaceFeedbackForScope([], homeError), rankingError);
    expect(visibleDashboardFeedbackFromList(feedback, "home")).toBe(homeError);
    expect(visibleDashboardFeedbackFromList(feedback, "rankings")).toBe(rankingError);
    expect(clearFeedbackListForScope(feedback, "home")).toEqual([rankingError]);
    expect(expireDashboardFeedbackFromList(feedback, "ranking")).toEqual([homeError]);
  });

  it("shows the newest relevant feedback when tab and mode scopes overlap", () => {
    const backgroundError = createDashboardFeedback({
      id: "background",
      kind: "error",
      scope: "beans",
      message: "background failed"
    });
    const actionError = createDashboardFeedback({
      id: "action",
      kind: "error",
      scope: "beans:draw",
      message: "draw failed"
    });
    expect(
      visibleDashboardFeedbackFromList([backgroundError, actionError], "beans", "draw")
    ).toBe(actionError);
    expect(
      visibleDashboardFeedbackFromList([backgroundError, actionError], "beans", "tank")
    ).toBe(backgroundError);
  });

  it("scopes feedback to a specific tab mode when requested", () => {
    const playError = createDashboardFeedback({
      id: "play",
      kind: "error",
      scope: "activities:play",
      message: "play failed"
    });
    expect(visibleDashboardFeedback(playError, "activities", "play")).toBe(playError);
    expect(visibleDashboardFeedback(playError, "activities", "history")).toBeNull();
    expect(visibleDashboardFeedback(playError, "activities")).toBeNull();
    expect(visibleDashboardFeedbackFromList([playError], "activities", "history")).toBeNull();
  });

  it("clears only the matching mode scope while preserving other modes", () => {
    const playError = createDashboardFeedback({ id: "play", kind: "error", scope: "activities:play", message: "play failed" });
    const historyError = createDashboardFeedback({ id: "history", kind: "error", scope: "activities:history", message: "history failed" });
    const feedback = [playError, historyError];
    expect(clearFeedbackListForScope(feedback, "activities", "play")).toEqual([historyError]);
    expect(clearFeedbackListForScope(feedback, "activities", "history")).toEqual([playError]);
  });

  it("clears all feedback for a tab when mode is omitted", () => {
    const playError = createDashboardFeedback({ id: "play", kind: "error", scope: "activities:play", message: "play failed" });
    const historyError = createDashboardFeedback({ id: "history", kind: "error", scope: "activities:history", message: "history failed" });
    expect(clearFeedbackListForScope([playError, historyError], "activities")).toEqual([]);
  });
});

describe("localized presentation", () => {
  it("localizes goal units", () => {
    expect(localizedGoalUnit("times")).toBe("次");
    expect(localizedGoalUnit("minutes")).toBe("分钟");
    expect(localizedGoalUnit("days")).toBe("天");
    expect(localizedGoalUnit("count")).toBe("count");
  });

  it("localizes known errors and hides unknown raw messages", () => {
    expect(localizedApiError({ code: "FRIEND_CODE_NOT_FOUND", message: "Friend code not found" })).toBe("没有找到这个好友码。");
    expect(localizedApiError({ code: "NEW_SERVER_ERROR", message: "Raw internal detail" })).toBe("操作没有成功，请稍后重试。");
  });
});

describe("cross-feature coherence", () => {
  it("refreshes fish tank only when the draw has tank outcomes", () => {
    expect(shouldRefreshFishTankAfterDraw({ fishTankOutcomes: [{ resourceType: "food" }] } as never)).toBe(true);
    expect(shouldRefreshFishTankAfterDraw({ fishTankOutcomes: [] } as never)).toBe(false);
    expect(shouldRefreshFishTankAfterDraw(null)).toBe(false);
  });

  it("synchronizes affected tank projections and reports stale refreshes", async () => {
    const affected = { fishTankOutcomes: [{ resourceType: "food" }] } as never;
    let refreshes = 0;
    expect(await synchronizeFishTankAfterBeanDraw(affected, async () => { refreshes += 1; return true; })).toBe("current");
    expect(await synchronizeFishTankAfterBeanDraw(affected, async () => { refreshes += 1; return false; })).toBe("stale");
    expect(await synchronizeFishTankAfterBeanDraw(null, async () => { refreshes += 1; return true; })).toBe("not-required");
    expect(refreshes).toBe(2);
  });

  it("detects fish tank outcomes across source result types", () => {
    expect(hasFishTankOutcomes({ fishTankOutcomes: [{ resourceType: "food" }] } as never)).toBe(true);
    expect(hasFishTankOutcomes({ fishTankOutcomes: [] } as never)).toBe(false);
    expect(hasFishTankOutcomes(null)).toBe(false);
    expect(hasFishTankOutcomes(undefined)).toBe(false);
  });

  it("synchronizes fish tank after generic reward results", async () => {
    const affected = { fishTankOutcomes: [{ resourceType: "bubble" }] } as never;
    let refreshes = 0;
    expect(await synchronizeFishTankAfterReward(affected, async () => { refreshes += 1; return true; })).toBe("current");
    expect(await synchronizeFishTankAfterReward(affected, async () => { refreshes += 1; return false; })).toBe("stale");
    expect(await synchronizeFishTankAfterReward(null, async () => { refreshes += 1; return true; })).toBe("not-required");
    expect(refreshes).toBe(2);
  });

  it("limits source reward follow-up to projection refresh without gameplay or navigation side effects", async () => {
    const affected = { fishTankOutcomes: [{ resourceType: "food" }] } as never;
    const sideEffects = {
      navigate: 0,
      feed: 0,
      bubble: 0,
      hatch: 0,
      equip: 0,
      draw: 0,
      claim: 0,
      resubmit: 0
    };
    let refreshes = 0;

    const result = await synchronizeFishTankAfterReward(affected, async () => {
      refreshes += 1;
      return true;
    });

    expect(result).toBe("current");
    expect(refreshes).toBe(1);
    expect(sideEffects).toEqual({
      navigate: 0,
      feed: 0,
      bubble: 0,
      hatch: 0,
      equip: 0,
      draw: 0,
      claim: 0,
      resubmit: 0
    });
  });

  it("makes direct action labels explicit", () => {
    expect(directActionLabel({ execution: "mutate", kind: "bean-draw", label: "立即抽豆" })).toBe("立即抽取 1 次");
    expect(directActionLabel({ execution: "navigate", kind: "bean-draw", label: "去抽豆" })).toBe("去抽豆");
  });

  it("models the tank inventory follow-up as navigation-only", () => {
    expect(fishTankInventoryFollowUp).toEqual({
      execution: "navigate",
      tab: "beans",
      target: "fish-tank"
    });
  });

  it("uses the newest durable receipt for follow-up actions", () => {
    const results = {
      lastResult: { reward: { drawChancesGranted: 1 } } as never,
      activityResult: { assignment: { assignmentId: "activity" } } as never,
      beanDrawResult: { remainingDrawChances: 0 } as never
    };
    expect(selectLatestLoopResults("bean-draw", results)).toEqual({
      lastResult: null,
      activityResult: null,
      beanDrawResult: results.beanDrawResult
    });
    expect(selectLatestLoopResults("activity", results).activityResult).toBe(results.activityResult);
  });

  it("prevents concurrent mutations and recovers after success", async () => {
    const gate = { current: false };
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    let calls = 0;
    const first = runSingleFlight(gate, async () => {
      calls += 1;
      await pending;
    });
    const repeated = await runSingleFlight(gate, () => {
      calls += 1;
    });
    expect(repeated).toBe(false);
    expect(calls).toBe(1);
    release();
    expect(await first).toBe(true);
    expect(await runSingleFlight(gate, () => { calls += 1; })).toBe(true);
    expect(calls).toBe(2);
  });

  it("releases the mutation gate after an error", async () => {
    const gate = { current: false };
    await expect(
      runSingleFlight(gate, () => {
        throw new Error("failed");
      })
    ).rejects.toThrow("failed");
    expect(gate.current).toBe(false);
  });
});
