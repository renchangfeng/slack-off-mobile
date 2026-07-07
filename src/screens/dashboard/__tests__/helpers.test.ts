// NOTE: Component-level render smoke tests are not practical in this repo's current
// Vitest setup because importing react-native fails with "Flow is not supported".
// These tests cover the closest practical pure-function view models instead.
import { describe, expect, it } from "vitest";
import type { ActivityAssignment, ActivityHistorySession } from "../../../api/activities";
import type { LeaderboardResponse } from "../../../api/leaderboards";
import type { ProgressionSummary } from "../../../api/progression";
import {
  achievementTargetTab,
  activityCategoryLabel,
  beanThemeLabel,
  buildReplaySimilarRequest,
  deriveActivityDailyReport,
  deriveActivityDisplayState,
  deriveActivityHistoryInsights,
  deriveHistorySections,
  difficultyLabel,
  fallbackActivityStatValue,
  findGoal,
  flavorLabel,
  formatActivityTime,
  formatDuration,
  formatHistorySessionTime,
  getLeaderboardList,
  getLeaderboardPodium,
  historySessionTimeValue,
  historySessionStatusTone,
  historyStatusLabel,
  isActivityInteractionComplete,
  isActivityStepComplete,
  pickAchievementFocus,
  rarityLabel,
  resolveActivityPresentation,
  resolveHistoryPresentation,
  skipReasonLabel
} from "../helpers";

describe("formatDuration", () => {
  it("formats elapsed minutes and seconds", () => {
    const now = Date.parse("2026-01-01T12:02:30.000Z");
    expect(formatDuration("2026-01-01T12:00:00.000Z", now)).toBe("02:30");
  });

  it("caps at 45:00+", () => {
    const now = Date.parse("2026-01-01T13:00:00.000Z");
    expect(formatDuration("2026-01-01T12:00:00.000Z", now)).toBe("45:00+");
  });
});

describe("label helpers", () => {
  it("labels activity categories", () => {
    expect(activityCategoryLabel("game")).toBe("小游戏");
    expect(activityCategoryLabel("unknown")).toBe("unknown");
  });

  it("labels difficulty", () => {
    expect(difficultyLabel("easy")).toBe("轻松");
    expect(difficultyLabel("hard")).toBe("硬核");
  });

  it("labels bean themes", () => {
    expect(beanThemeLabel("office")).toBe("工位卡池");
  });

  it("labels rarities", () => {
    expect(rarityLabel("legendary")).toBe("传说");
    expect(rarityLabel("common")).toBe("普通");
  });

  it("formats activity time", () => {
    const formatted = formatActivityTime("2026-06-26T14:30:00.000Z");
    expect(formatted).toContain("6");
    expect(formatted).toContain("26");
  });
});

describe("resolveActivityPresentation", () => {
  it("uses provided presentation", () => {
    const presentation = {
      badge: "测试",
      tone: "calm",
      accentColor: "#000",
      headline: "标题",
      scene: "场景",
      prompt: "提示",
      statLabel: "统计",
      statValue: "50%"
    } as import("../../../api/activities").ActivityPresentation;
    expect(
      resolveActivityPresentation({
        title: "t",
        description: "d",
        category: "rest",
        difficulty: "easy",
        presentation
      })
    ).toEqual(presentation);
  });

  it("falls back by category", () => {
    const result = resolveActivityPresentation({
      title: "游戏",
      description: "描述",
      category: "game",
      difficulty: "normal"
    });
    expect(result.badge).toBe("小游戏入口");
    expect(result.tone).toBe("game");
  });
});

describe("fallbackActivityStatValue", () => {
  it("returns deterministic percentage", () => {
    const a = fallbackActivityStatValue("seed", "easy");
    const b = fallbackActivityStatValue("seed", "easy");
    expect(a).toBe(b);
    expect(a.endsWith("%")).toBe(true);
  });
});

describe("isActivityStepComplete", () => {
  it("completes ack step when id is present", () => {
    expect(
      isActivityStepComplete(
        { id: "s1", type: "ack", title: "", description: "", required: true } as ActivityAssignment["interaction"]["steps"][number],
        { completedStepIds: ["s1"] }
      )
    ).toBe(true);
  });

  it("completes timer step when seconds reached", () => {
    expect(
      isActivityStepComplete(
        { id: "s1", type: "timer", title: "", description: "", durationSeconds: 5, required: true } as ActivityAssignment["interaction"]["steps"][number],
        { timerSeconds: { s1: 5 } }
      )
    ).toBe(true);
  });

  it("completes choice step with correct answer", () => {
    const step = {
      id: "s1",
      type: "choice",
      title: "",
      description: "",
      options: [{ id: "a", label: "A", resultText: "" }],
      correctOptionId: "a",
      required: true
    } as ActivityAssignment["interaction"]["steps"][number];
    expect(
      isActivityStepComplete(step, { choiceAnswers: { s1: "unknown" } })
    ).toBe(false);
    expect(
      isActivityStepComplete(
        step,
        { choiceAnswers: { s1: "a" } }
      )
    ).toBe(true);
  });

  it("completes mini game step when passed", () => {
    expect(
      isActivityStepComplete(
        { id: "s1", type: "mini_game", title: "", description: "", required: true } as ActivityAssignment["interaction"]["steps"][number],
        { miniGameResults: { s1: { passed: true, score: 5 } } }
      )
    ).toBe(true);
  });
});

describe("isActivityInteractionComplete", () => {
  it("returns true when all required steps complete", () => {
    const assignment = {
      interaction: {
        steps: [
          { id: "s1", type: "ack", title: "", description: "", required: true },
          { id: "s2", type: "ack", title: "", description: "", required: false }
        ]
      }
    } as ActivityAssignment;
    expect(isActivityInteractionComplete(assignment, { completedStepIds: ["s1"] })).toBe(true);
  });

  it("returns false when a required step is incomplete", () => {
    const assignment = {
      interaction: {
        steps: [
          { id: "s1", type: "ack", title: "", description: "", required: true },
          { id: "s2", type: "ack", title: "", description: "", required: true }
        ]
      }
    } as ActivityAssignment;
    expect(isActivityInteractionComplete(assignment, { completedStepIds: ["s1"] })).toBe(false);
  });
});

describe("leaderboard split helpers", () => {
  const makeLeaderboard = (count: number): LeaderboardResponse =>
    ({
      window: "daily",
      windowStart: "2026-06-26T00:00:00.000Z",
      scope: "global",
      suppressed: false,
      suppressionReason: null,
      items: Array.from({ length: count }, (_, index) => ({
        rank: index + 1,
        userId: `u${index + 1}`,
        displayName: `User ${index + 1}`,
        score: 100 - index,
        reactions: { tissue: 0, like: 0 }
      })),
      currentUser: { rank: 5, userId: "u5", displayName: "Me", score: 50, reactions: { tissue: 0, like: 0 } }
    } as LeaderboardResponse);

  it("returns empty podium for empty leaderboard", () => {
    expect(getLeaderboardPodium(null)).toEqual([]);
    expect(getLeaderboardPodium({ window: "daily", windowStart: "", scope: "global", suppressed: false, suppressionReason: null, items: [], currentUser: null } as LeaderboardResponse)).toEqual([]);
  });

  it("orders podium second-first-third when enough items", () => {
    const podium = getLeaderboardPodium(makeLeaderboard(5));
    expect(podium.map((item) => item.rank)).toEqual([2, 1, 3]);
  });

  it("returns single item for one-entry leaderboard", () => {
    const podium = getLeaderboardPodium(makeLeaderboard(1));
    expect(podium.map((item) => item.rank)).toEqual([1]);
  });

  it("splits list items from rank 4", () => {
    const list = getLeaderboardList(makeLeaderboard(6));
    expect(list.map((item) => item.rank)).toEqual([4, 5, 6]);
  });
});

describe("findGoal", () => {
  it("finds goal by code", () => {
    const progression = {
      dailyGoals: {
        goals: [
          { code: "check_in", title: "Check in", description: "", current: 0, target: 1, completed: false },
          { code: "activity", title: "Activity", description: "", current: 0, target: 1, completed: false }
        ]
      }
    } as ProgressionSummary;
    expect(findGoal(progression, "check_in")?.title).toBe("Check in");
    expect(findGoal(progression, "bean_draw")).toBeNull();
  });
});

describe("achievement focus helpers", () => {
  it("picks today focus first", () => {
    const focus = { id: "t1", name: "Today", targetSection: "home" } as import("../../../api/achievements").AchievementRecommendation;
    const list = {
      achievements: [],
      recommendations: {
        today: [focus],
        nearest: [],
        long_term: []
      }
    } as import("../../../api/achievements").AchievementList;
    expect(pickAchievementFocus(list)).toBe(focus);
  });

  it("maps leaderboard target section to rankings tab", () => {
    expect(
      achievementTargetTab({ targetSection: "leaderboards" } as import("../../../api/achievements").AchievementRecommendation)
    ).toBe("rankings");
  });
});

describe("deriveActivityDisplayState", () => {
  const baseAssignment = {
    assignmentId: "a1",
    status: "active",
    title: "测试任务",
    description: "描述",
    category: "rest",
    difficulty: "easy",
    interaction: {
      steps: [
        { id: "s1", type: "ack", title: "确认", description: "确认一下", required: true }
      ]
    },
    interactionSummary: { flavorLabel: "测试" },
    rewardPreview: { score: 3, drawProgress: 0 }
  } as ActivityAssignment;

  it("returns empty when there is no assignment", () => {
    expect(deriveActivityDisplayState(null, {}, false)).toEqual({ kind: "empty" });
  });

  it("returns unavailable when no assignment and service reports unavailable", () => {
    expect(deriveActivityDisplayState(null, {}, true)).toEqual({ kind: "unavailable" });
  });

  it("returns completed for completed assignments regardless of progress", () => {
    const completed = { ...baseAssignment, status: "completed" as const };
    expect(deriveActivityDisplayState(completed, {}, false)).toEqual({ kind: "completed" });
  });

  it("returns skipped for skipped assignments", () => {
    const skipped = { ...baseAssignment, status: "skipped" as const };
    expect(deriveActivityDisplayState(skipped, {}, false)).toEqual({ kind: "skipped" });
  });

  it("returns active-incomplete when required steps are not done", () => {
    expect(deriveActivityDisplayState(baseAssignment, {}, false)).toEqual({
      kind: "active-incomplete",
      canComplete: false
    });
  });

  it("returns active-ready when all required steps are done", () => {
    expect(
      deriveActivityDisplayState(baseAssignment, { completedStepIds: ["s1"] }, false)
    ).toEqual({ kind: "active-ready", canComplete: true });
  });

  it("treats a completed assignment as resolved even if local progress is empty", () => {
    const completed = { ...baseAssignment, status: "completed" as const };
    expect(deriveActivityDisplayState(completed, {}, false).kind).toBe("completed");
  });
});

describe("flavorLabel", () => {
  it("labels known flavors", () => {
    expect(flavorLabel("weird")).toBe("脑洞一点");
    expect(flavorLabel("quick")).toBe("快速完成");
  });

  it("falls back to raw value", () => {
    expect(flavorLabel("unknown")).toBe("unknown");
  });
});

describe("formatHistorySessionTime", () => {
  it("includes month and day", () => {
    const formatted = formatHistorySessionTime("2026-06-26T14:30:00.000Z");
    expect(formatted).toContain("6");
    expect(formatted).toContain("26");
  });

  it("falls back for missing or invalid values", () => {
    expect(formatHistorySessionTime(null)).toBe("时间未知");
    expect(formatHistorySessionTime(undefined)).toBe("时间未知");
    expect(formatHistorySessionTime("not-a-date")).toBe("时间未知");
  });
});

describe("historyStatusLabel", () => {
  it("labels completed and rewarded", () => {
    expect(historyStatusLabel("completed", true)).toBe("已完成");
  });

  it("labels completed but not rewarded", () => {
    expect(historyStatusLabel("completed", false)).toBe("未完成奖励");
  });

  it("labels skipped and expired", () => {
    expect(historyStatusLabel("skipped", false)).toBe("已跳过");
    expect(historyStatusLabel("expired", false)).toBe("已过期");
  });

  it("defaults to in-progress", () => {
    expect(historyStatusLabel("active", false)).toBe("进行中");
  });
});

describe("deriveHistorySections", () => {
  const makeSession = (sessionAt: string): ActivityHistorySession =>
    ({
      assignmentId: "a1",
      sessionAt,
      status: "completed"
    } as ActivityHistorySession);

  it("puts today sessions in today bucket", () => {
    const now = new Date().toISOString();
    const result = deriveHistorySections([makeSession(now)]);
    expect(result.today).toHaveLength(1);
    expect(result.recent).toHaveLength(0);
  });

  it("puts older sessions in recent bucket", () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const result = deriveHistorySections([makeSession(yesterday)]);
    expect(result.today).toHaveLength(0);
    expect(result.recent).toHaveLength(1);
  });

  it("falls back to completedAt or assignedAt when sessionAt is missing", () => {
    const now = new Date().toISOString();
    const result = deriveHistorySections([
      { ...makeSession(""), sessionAt: undefined as never, completedAt: now }
    ]);
    expect(result.today).toHaveLength(1);
  });
});

describe("historySessionTimeValue", () => {
  it("uses sessionAt, then completedAt, then assignedAt", () => {
    expect(
      historySessionTimeValue({
        sessionAt: "session",
        completedAt: "completed",
        assignedAt: "assigned"
      } as ActivityHistorySession)
    ).toBe("session");
    expect(
      historySessionTimeValue({
        sessionAt: undefined,
        completedAt: "completed",
        assignedAt: "assigned"
      } as unknown as ActivityHistorySession)
    ).toBe("completed");
    expect(
      historySessionTimeValue({
        sessionAt: undefined,
        completedAt: null,
        assignedAt: "assigned"
      } as unknown as ActivityHistorySession)
    ).toBe("assigned");
  });
});

describe("buildReplaySimilarRequest", () => {
  it("builds a replay hint that preserves ownership and excludes the same template", () => {
    const session = {
      assignmentId: "assignment-1",
      templateId: "template-1",
      category: "imagination",
      flavor: "weird"
    } as ActivityHistorySession;
    const request = buildReplaySimilarRequest(session);
    expect(request.replayHint?.sourceAssignmentId).toBe("assignment-1");
    expect(request.replayHint?.excludeTemplateId).toBe("template-1");
    expect(request.replayHint?.preferredCategory).toBe("imagination");
    expect(request.replayHint?.preferredFlavor).toBe("weird");
  });

  it("omits preferredFlavor when the session has none", () => {
    const session = {
      assignmentId: "assignment-2",
      templateId: "template-2",
      category: "rest"
    } as ActivityHistorySession;
    const request = buildReplaySimilarRequest(session);
    expect(request.replayHint?.preferredFlavor).toBeUndefined();
  });
});

describe("resolveHistoryPresentation", () => {
  it("uses the session presentation when present", () => {
    const presentation = {
      badge: "历史",
      tone: "calm" as const,
      accentColor: "#000",
      headline: "标题",
      scene: "场景",
      prompt: "提示",
      statLabel: "统计",
      statValue: "50%"
    };
    const session = {
      title: "t",
      description: "d",
      category: "rest",
      difficulty: "easy",
      presentation
    } as ActivityHistorySession;
    expect(resolveHistoryPresentation(session)).toEqual(presentation);
  });

  it("falls back to resolveActivityPresentation when missing", () => {
    const session = {
      title: "游戏",
      description: "描述",
      category: "game",
      difficulty: "normal"
    } as ActivityHistorySession;
    const result = resolveHistoryPresentation(session);
    expect(result.badge).toBe("小游戏入口");
    expect(result.tone).toBe("game");
  });
});

function makeHistorySession(
  partial: Partial<ActivityHistorySession> &
    Pick<ActivityHistorySession, "assignmentId" | "status" | "sessionAt">
): ActivityHistorySession {
  const base: ActivityHistorySession = {
    assignmentId: partial.assignmentId,
    templateId: "template-1",
    code: "test-code",
    title: "Test activity",
    description: "Test session.",
    category: "rest",
    difficulty: "easy",
    status: partial.status,
    flavor: "quick",
    presentation: {
      badge: "Test",
      tone: "calm",
      accentColor: "#1f8f62",
      headline: "Test activity",
      scene: "Test scene.",
      prompt: "Test prompt.",
      statLabel: "统计",
      statValue: "100%"
    },
    rewardSummary: { score: 8, drawProgress: 1, rewarded: partial.status === "completed" },
    assignedAt: partial.sessionAt,
    completedAt: partial.status === "completed" ? partial.sessionAt : null,
    sessionAt: partial.sessionAt,
    skipReason: partial.status === "skipped" ? "not_interested" : null,
    feedback: null,
    replayHint: {
      sourceAssignmentId: partial.assignmentId,
      sourceTemplateId: "template-1",
      preferredCategory: partial.category ?? "rest",
      preferredFlavor: "quick",
      excludeTemplateId: "template-1"
    }
  };
  return { ...base, ...partial };
}

describe("deriveActivityDailyReport", () => {
  it("returns zero totals and empty summary when there is no history", () => {
    const report = deriveActivityDailyReport([]);
    expect(report.completedCount).toBe(0);
    expect(report.skippedCount).toBe(0);
    expect(report.expiredCount).toBe(0);
    expect(report.totalScore).toBe(0);
    expect(report.totalDrawProgress).toBe(0);
    expect(report.dominantCategory).toBeNull();
    expect(report.dominantFlavor).toBeNull();
    expect(report.hasToday).toBe(false);
    expect(report.summary).toContain("今天还没有摸鱼记录");
  });

  it("counts only today's rewarded completions toward score and draw progress", () => {
    const now = new Date().toISOString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const history: ActivityHistorySession[] = [
      makeHistorySession({ assignmentId: "a", status: "completed", sessionAt: now, rewardSummary: { score: 10, drawProgress: 2, rewarded: true } }),
      makeHistorySession({ assignmentId: "b", status: "completed", sessionAt: now, rewardSummary: { score: 5, drawProgress: 1, rewarded: false }, category: "game", flavor: "weird" }),
      makeHistorySession({ assignmentId: "c", status: "skipped", sessionAt: now, category: "imagination" }),
      makeHistorySession({ assignmentId: "d", status: "expired", sessionAt: now, category: "office_theater" }),
      makeHistorySession({ assignmentId: "e", status: "completed", sessionAt: yesterday, rewardSummary: { score: 99, drawProgress: 9, rewarded: true } })
    ];
    const report = deriveActivityDailyReport(history);
    expect(report.completedCount).toBe(2);
    expect(report.skippedCount).toBe(1);
    expect(report.expiredCount).toBe(1);
    expect(report.totalScore).toBe(10);
    expect(report.totalDrawProgress).toBe(2);
    expect(report.hasToday).toBe(true);
  });

  it("picks dominant category and flavor from completed sessions first, then all today", () => {
    const now = new Date().toISOString();
    const history: ActivityHistorySession[] = [
      makeHistorySession({ assignmentId: "a", status: "completed", sessionAt: now, category: "game", flavor: "weird" }),
      makeHistorySession({ assignmentId: "b", status: "completed", sessionAt: now, category: "game", flavor: "weird" }),
      makeHistorySession({ assignmentId: "c", status: "skipped", sessionAt: now, category: "rest", flavor: "quick" })
    ];
    const report = deriveActivityDailyReport(history);
    expect(report.dominantCategory).toBe("game");
    expect(report.dominantFlavor).toBe("weird");
  });

  it("falls back to all today sessions when no completions exist", () => {
    const now = new Date().toISOString();
    const history: ActivityHistorySession[] = [
      makeHistorySession({ assignmentId: "a", status: "skipped", sessionAt: now, category: "physical", flavor: "tiny_challenge" }),
      makeHistorySession({ assignmentId: "b", status: "expired", sessionAt: now, category: "physical", flavor: "tiny_challenge" })
    ];
    const report = deriveActivityDailyReport(history);
    expect(report.dominantCategory).toBe("physical");
    expect(report.dominantFlavor).toBe("tiny_challenge");
    expect(report.summary).toContain("跳过了");
  });

  it("summarizes a fully rewarded day", () => {
    const now = new Date().toISOString();
    const history: ActivityHistorySession[] = [
      makeHistorySession({ assignmentId: "a", status: "completed", sessionAt: now, rewardSummary: { score: 8, drawProgress: 1, rewarded: true }, category: "rest", flavor: "recharge" })
    ];
    const report = deriveActivityDailyReport(history);
    expect(report.summary).toContain("完成了 1 个小休息");
    expect(report.summary).toContain("+8");
    expect(report.summary).toContain("充电恢复");
  });
});

describe("deriveActivityHistoryInsights", () => {
  it("returns empty suggestions when history is sparse", () => {
    const insights = deriveActivityHistoryInsights([]);
    expect(insights.hasEnoughData).toBe(false);
    expect(insights.suggestion).toBeNull();
    expect(insights.dominantCategory7d).toBeNull();
    expect(insights.dominantFlavor7d).toBeNull();
    expect(insights.commonSkipReason).toBeNull();
    expect(insights.skipHeavy).toBe(false);
  });

  it("computes dominant category, flavor, and common skip reason over the last 7 days", () => {
    const now = new Date().toISOString();
    const history: ActivityHistorySession[] = [
      makeHistorySession({ assignmentId: "a", status: "completed", sessionAt: now, category: "game", flavor: "weird" }),
      makeHistorySession({ assignmentId: "b", status: "skipped", sessionAt: now, category: "game", flavor: "weird", skipReason: "too_much_work" }),
      makeHistorySession({ assignmentId: "c", status: "skipped", sessionAt: now, category: "rest", flavor: "quick", skipReason: "too_much_work" }),
      makeHistorySession({ assignmentId: "d", status: "completed", sessionAt: now, category: "game", flavor: "weird" })
    ];
    const insights = deriveActivityHistoryInsights(history);
    expect(insights.hasEnoughData).toBe(true);
    expect(insights.dominantCategory7d).toBe("game");
    expect(insights.dominantFlavor7d).toBe("weird");
    expect(insights.commonSkipReason).toBe("too_much_work");
  });

  it("flags skip-heavy history", () => {
    const now = new Date().toISOString();
    const history: ActivityHistorySession[] = [
      makeHistorySession({ assignmentId: "a", status: "skipped", sessionAt: now, skipReason: "too_much_work" }),
      makeHistorySession({ assignmentId: "b", status: "skipped", sessionAt: now, skipReason: "not_interested" }),
      makeHistorySession({ assignmentId: "c", status: "completed", sessionAt: now })
    ];
    const insights = deriveActivityHistoryInsights(history);
    expect(insights.skipHeavy).toBe(true);
    expect(insights.suggestion).toContain("跳过比较多");
  });

  it("ignores sessions outside the window", () => {
    const now = new Date().toISOString();
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    const history: ActivityHistorySession[] = [
      makeHistorySession({ assignmentId: "a", status: "completed", sessionAt: now, category: "game", flavor: "weird" }),
      makeHistorySession({ assignmentId: "b", status: "completed", sessionAt: eightDaysAgo, category: "rest", flavor: "quick" })
    ];
    const insights = deriveActivityHistoryInsights(history);
    expect(insights.dominantCategory7d).toBe("game");
    expect(insights.dominantFlavor7d).toBe("weird");
  });

  it("respects a custom window", () => {
    const now = new Date().toISOString();
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const history: ActivityHistorySession[] = [
      makeHistorySession({ assignmentId: "a", status: "completed", sessionAt: twoDaysAgo, category: "rest", flavor: "quick" })
    ];
    const insights = deriveActivityHistoryInsights(history, 1);
    expect(insights.hasEnoughData).toBe(false);
    expect(insights.dominantCategory7d).toBeNull();

    const included = deriveActivityHistoryInsights(history, 3);
    expect(included.hasEnoughData).toBe(false);
    expect(included.dominantCategory7d).toBe("rest");
  });
});

describe("historySessionStatusTone", () => {
  it("maps completed + rewarded to completed", () => {
    expect(historySessionStatusTone("completed", true)).toBe("completed");
  });

  it("maps completed unrewarded and skipped to warning", () => {
    expect(historySessionStatusTone("completed", false)).toBe("warning");
    expect(historySessionStatusTone("skipped", false)).toBe("warning");
    expect(historySessionStatusTone("skipped", true)).toBe("warning");
  });

  it("maps expired to locked", () => {
    expect(historySessionStatusTone("expired", false)).toBe("locked");
    expect(historySessionStatusTone("expired", true)).toBe("locked");
  });

  it("maps active to default", () => {
    expect(historySessionStatusTone("active", false)).toBe("default");
    expect(historySessionStatusTone("active", true)).toBe("default");
  });
});

describe("skipReasonLabel", () => {
  it("returns Chinese labels for known reasons", () => {
    expect(skipReasonLabel("not_interested")).toBe("没兴趣");
    expect(skipReasonLabel("too_much_work")).toBe("太麻烦");
    expect(skipReasonLabel("not_convenient")).toBe("不方便");
    expect(skipReasonLabel("want_weirder")).toBe("想来点怪的");
    expect(skipReasonLabel("other")).toBe("换个口味");
  });

  it("falls back to the raw reason value", () => {
    expect(skipReasonLabel("unknown_reason" as never)).toBe("unknown_reason");
  });
});

describe("skipped sessions never count as rewarded completions", () => {
  it("excludes skipped sessions from daily report score and completion count", () => {
    const now = new Date().toISOString();
    const history: ActivityHistorySession[] = [
      makeHistorySession({ assignmentId: "a", status: "skipped", sessionAt: now, rewardSummary: { score: 10, drawProgress: 1, rewarded: true } }),
      makeHistorySession({ assignmentId: "b", status: "completed", sessionAt: now, rewardSummary: { score: 6, drawProgress: 1, rewarded: true } })
    ];
    const report = deriveActivityDailyReport(history);
    expect(report.completedCount).toBe(1);
    expect(report.skippedCount).toBe(1);
    expect(report.totalScore).toBe(6);
    expect(report.totalDrawProgress).toBe(1);
  });
});
