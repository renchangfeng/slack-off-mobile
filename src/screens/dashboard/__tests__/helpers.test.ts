// NOTE: Component-level render smoke tests are not practical in this repo's current
// Vitest setup because importing react-native fails with "Flow is not supported".
// These tests cover the closest practical pure-function view models instead.
import { describe, expect, it } from "vitest";
import type { ActivityAssignment } from "../../../api/activities";
import type { LeaderboardResponse } from "../../../api/leaderboards";
import type { ProgressionSummary } from "../../../api/progression";
import {
  achievementTargetTab,
  activityCategoryLabel,
  beanThemeLabel,
  deriveActivityDisplayState,
  difficultyLabel,
  fallbackActivityStatValue,
  findGoal,
  formatActivityTime,
  formatDuration,
  getLeaderboardList,
  getLeaderboardPodium,
  isActivityInteractionComplete,
  isActivityStepComplete,
  pickAchievementFocus,
  rarityLabel,
  resolveActivityPresentation
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
