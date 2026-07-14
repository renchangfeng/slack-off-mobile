import { Fragment, createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "../../../ui/theme/ThemeProvider";
import { ActivitiesTab } from "../ActivitiesTab";
import { BeansTab } from "../BeansTab";
import { LeaderboardsTab } from "../LeaderboardsTab";
import { ProfileTab } from "../ProfileTab";
import { HomeTab } from "../HomeTab";
import { DashboardFeedbackBanner } from "../parts/DashboardFeedbackBanner";
import {
  makeActivitiesProps,
  makeBeansProps,
  makeHomeProps,
  makeLeaderboardsProps,
  makeProfileProps
} from "../../dev/CoreSurfaceSpecimens";

function render(component: React.ReactNode) {
  return renderToStaticMarkup(createElement(ThemeProvider, null, component));
}

describe("Home hierarchy component", () => {
  it("places an actionable Home error before the current rest state", () => {
    const markup = render(
      createElement(
        Fragment,
        null,
        createElement(DashboardFeedbackBanner, {
          feedback: {
            id: "home-error",
            kind: "error",
            scope: "home",
            message: "打卡没有成功，请稍后重试。",
            autoDismiss: false
          },
          onDismiss: () => undefined
        }),
        createElement(HomeTab, makeHomeProps({ loading: true }))
      )
    );

    expect(markup).toContain('aria-live="assertive"');
    expect(markup).toContain("打卡没有成功，请稍后重试。");
    expect(markup.indexOf("打卡没有成功，请稍后重试。")).toBeLessThan(
      markup.indexOf("没有进行中的打卡。")
    );
    expect(markup).toContain('aria-disabled="true"');
  });
});

describe("Activities mode components", () => {
  const baseAssignment = {
    assignmentId: "activity-1",
    status: "active",
    title: "闭眼听十秒办公室背景音",
    description: "确认完成后领取奖励。",
    category: "rest",
    difficulty: "easy",
    interaction: {
      steps: [
        {
          id: "ack-1",
          type: "ack",
          title: "已经听完",
          description: "确认即可",
          required: true
        }
      ]
    },
    interactionSummary: { flavorLabel: "快速完成" },
    rewardPreview: { score: 3, drawProgress: 1 }
  } as any;

  it("separates empty and unavailable play states from history", () => {
    const empty = render(createElement(ActivitiesTab, makeActivitiesProps({ mode: "play" })));
    const unavailable = render(
      createElement(ActivitiesTab, makeActivitiesProps({ mode: "play", unavailable: true }))
    );
    const history = render(
      createElement(ActivitiesTab, makeActivitiesProps({ mode: "history" }))
    );

    expect(empty).toContain("还没有任务");
    expect(unavailable).toContain("暂无可推荐任务");
    expect(history).toContain("最近休息过什么");
    expect(history).toContain("还没有完成记录");
    expect(history).not.toContain("这次想怎么休息");
  });

  it("renders history loading, error, and pagination states", () => {
    const loading = render(
      createElement(
        ActivitiesTab,
        makeActivitiesProps({ mode: "history", historyLoading: true })
      )
    );
    const error = render(
      createElement(
        ActivitiesTab,
        makeActivitiesProps({
          mode: "history",
          historyError: "历史加载失败，请重试。",
          historyCursor: "next-page"
        })
      )
    );

    expect(loading).toContain("正在整理活动历史");
    expect(error).toContain("历史加载失败，请重试。");
    expect(error).toContain("加载更多");
  });

  it("renders incomplete, ready, completed, and skipped play states", () => {
    const incomplete = render(
      createElement(
        ActivitiesTab,
        makeActivitiesProps({ mode: "play", assignment: baseAssignment })
      )
    );
    const ready = render(
      createElement(
        ActivitiesTab,
        makeActivitiesProps({
          mode: "play",
          assignment: baseAssignment,
          progress: { completedStepIds: ["ack-1"] }
        })
      )
    );
    const completed = render(
      createElement(
        ActivitiesTab,
        makeActivitiesProps({
          mode: "play",
          assignment: { ...baseAssignment, status: "completed" }
        })
      )
    );
    const skipped = render(
      createElement(
        ActivitiesTab,
        makeActivitiesProps({
          mode: "play",
          assignment: { ...baseAssignment, status: "skipped" }
        })
      )
    );

    expect(incomplete).toContain("先完成互动步骤");
    expect(ready).toContain("领取互动奖励");
    expect(completed).toContain("本次活动已完成");
    expect(skipped).toContain("任务已放弃");
  });

  it("renders populated and paginated history without the play interaction", () => {
    const populated = render(
      createElement(
        ActivitiesTab,
        makeActivitiesProps({
          mode: "history",
          historyCursor: "next-page",
          history: [
            {
              assignmentId: "history-1",
              templateId: "template-1",
              status: "completed",
              title: "喝一口水",
              description: "短暂离开屏幕",
              category: "rest",
              difficulty: "easy",
              assignedAt: new Date().toISOString(),
              completedAt: new Date().toISOString(),
              sessionAt: new Date().toISOString(),
              rewardSummary: { score: 3, drawProgress: 1, rewarded: true }
            } as any
          ]
        })
      )
    );

    expect(populated).toContain("喝一口水");
    expect(populated).toContain("加载更多");
    expect(populated).not.toContain("先完成互动步骤");
  });
});

describe("Beans mode components", () => {
  const initializedTank = {
    initialized: true,
    fish: [
      {
        id: "fish-1",
        definitionId: "fish-def-1",
        name: "工位贝塔",
        rarity: "common",
        personality: "擅长发呆的",
        artKey: "fish-tank-fish"
      }
    ],
    nextAction: "feed",
    moodCopy: "小鱼正在假装工作。",
    mood: {
      code: "idle",
      title: "一起发呆",
      copy: "小鱼正在假装工作。",
      ambientArtKey: "tank-mood-idle"
    },
    decorations: { equipped: [], inventory: [] },
    careAvailability: {
      feed: { available: true, nextAvailableAt: null, cooldownRemainingSeconds: 0 }
    },
    hatchAvailability: {
      available: true,
      reason: null,
      currentProgress: 3,
      cost: 3,
      missingProgress: 0
    },
    collection: {
      owned: 1,
      total: 2,
      percent: 50,
      complete: false,
      items: [
        {
          definitionId: "fish-def-1",
          name: "工位贝塔",
          rarity: "common",
          personality: "擅长发呆的",
          artKey: "fish-tank-fish",
          sourceHint: "starter",
          owned: true
        },
        {
          definitionId: "fish-def-2",
          name: null,
          rarity: null,
          personality: null,
          artKey: null,
          sourceHint: "hatch",
          owned: false
        }
      ]
    },
    resourceSummary: {
      resources: [],
      totalFood: 1,
      totalBubbles: 0,
      totalHatchProgress: 3
    }
  } as any;

  it("keeps tank, draw, and collection content isolated", () => {
    const tank = render(createElement(BeansTab, makeBeansProps({ mode: "tank" })));
    const draw = render(createElement(BeansTab, makeBeansProps({ mode: "draw" })));
    const collection = render(
      createElement(BeansTab, makeBeansProps({ mode: "collection" }))
    );

    expect(tank).toContain("个人鱼缸");
    expect(draw).toContain("抽豆账户");
    expect(draw).not.toContain("展示柜");
    expect(collection).toContain("展示柜");
    expect(collection).toContain("这个卡池空空如也");
    expect(collection).not.toContain("抽豆账户");
  });

  it("keeps owning-mode errors and loading states visible", () => {
    const tankError = render(
      createElement(
        BeansTab,
        makeBeansProps({
          mode: "tank",
          fishTankError: "鱼缸同步失败，请重试。"
        })
      )
    );
    const drawLoading = render(
      createElement(BeansTab, makeBeansProps({ mode: "draw", loading: true }))
    );

    expect(tankError).toContain("鱼缸同步失败，请重试。");
    expect(drawLoading).toContain("抽豆账户");
  });

  it("renders draw, hatch, and decoration receipts in their owning modes", () => {
    const drawReceipt = render(
      createElement(
        BeansTab,
        makeBeansProps({
          mode: "draw",
          drawResult: {
            bean: {
              id: "bean-1",
              name: "会议逃生豆",
              theme: "office",
              rarity: "rare",
              description: "看起来很会提前离会。"
            },
            duplicate: false,
            pityTriggered: false,
            fragmentsGranted: 0,
            remainingDrawChances: 1,
            fishTankOutcomes: [
              {
                resourceType: "food",
                label: "鱼粮",
                quantity: 1,
                copy: "鱼缸库存已同步。"
              }
            ],
            resultTitle: "新豆入袋",
            nextHint: "去鱼缸看看"
          } as any
        })
      )
    );
    const tankReceipts = render(
      createElement(
        BeansTab,
        makeBeansProps({
          mode: "tank",
          fishTank: initializedTank,
          hatchResult: {
            success: true,
            replayed: false,
            discoveredFish: {
              id: "fish-2",
              definitionId: "fish-def-2",
              name: "打印机和平贝塔",
              rarity: "common",
              theme: "office",
              personality: "宽容卡纸的",
              artKey: "fish-tank-fish",
              acquiredSource: "hatch",
              createdAt: new Date().toISOString()
            },
            cost: 3,
            outcomeCode: "DISCOVERED",
            resultTitle: "新鱼登场",
            resultCopy: "从进度里游了出来。",
            nextHint: "返回鱼缸看看。",
            tank: initializedTank
          } as any,
          equipResult: {
            success: true,
            replayed: false,
            outcomeCode: "EQUIPPED",
            resultTitle: "装扮已更换",
            resultCopy: "已经放进鱼缸。",
            equipped: {
              slot: "background",
              definitionId: "decor-bg",
              code: "office_window",
              name: "办公室窗景",
              type: "background",
              rarity: "rare",
              artKey: "tank-bg-office-window"
            },
            tank: initializedTank
          } as any
        })
      )
    );

    expect(drawReceipt).toContain("抽豆结果");
    expect(drawReceipt).toContain("会议逃生豆");
    expect(drawReceipt).toContain("鱼缸库存已同步。");
    expect(drawReceipt).toContain("看看鱼缸库存");
    expect(tankReceipts).toContain("新鱼登场");
    expect(tankReceipts).toContain("装扮已更换");
    const closeEquipStart = tankReceipts.indexOf('aria-label="关闭装备结果"');
    const closeHatchStart = tankReceipts.indexOf('aria-label="关闭孵化结果"');
    const equipReturnStart = tankReceipts.indexOf('aria-label="返回鱼缸"', closeEquipStart);
    const hatchReturnStart = tankReceipts.indexOf('aria-label="返回鱼缸"', closeHatchStart);
    expect(tankReceipts.indexOf("</button>", closeEquipStart)).toBeLessThan(equipReturnStart);
    expect(tankReceipts.indexOf("</button>", closeHatchStart)).toBeLessThan(hatchReturnStart);
  });

  it("keeps hatch and equip errors visible with initialized tank state", () => {
    const markup = render(
      createElement(
        BeansTab,
        makeBeansProps({
          mode: "tank",
          fishTank: initializedTank,
          hatchError: "孵化没有成功，请重试。",
          equipError: "这件装扮还没有解锁。"
        })
      )
    );

    expect(markup).toContain("孵化没有成功，请重试。");
    expect(markup).toContain("这件装扮还没有解锁。");
  });

  it("renders owned and locked collection entries without making locked beans actionable", () => {
    const markup = render(
      createElement(
        BeansTab,
        makeBeansProps({
          mode: "collection",
          collection: {
            drawChances: 1,
            drawProgress: 0,
            pityCount: 0,
            pityThreshold: 8,
            fragments: 0,
            fragmentExchangeCost: 10,
            summary: { collected: 1, total: 2, percent: 50, nextAction: "继续收集" },
            nextTarget: null,
            themes: [],
            showcase: [],
            combinations: [],
            beans: [
              {
                id: "owned-bean",
                name: "会议逃生豆",
                theme: "office",
                rarity: "rare",
                quantity: 1,
                owned: true,
                description: "很会提前离会。"
              },
              {
                id: "locked-bean",
                name: "打印机卡纸豆",
                theme: "office",
                rarity: "epic",
                quantity: 0,
                owned: false,
                description: "尚未发现。"
              }
            ]
          } as any
        })
      )
    );

    expect(markup).toContain("会议逃生豆");
    expect(markup).toContain("放入第 1 格");
    expect(markup).toContain("打印机卡纸豆");
    expect(markup).toContain("尚未获得，先保持一点神秘。");
    expect(markup).toContain('aria-disabled="true"');
  });
});

describe("Leaderboards and Profile mode components", () => {
  it("separates ranking from private social management", () => {
    const ranking = render(
      createElement(LeaderboardsTab, makeLeaderboardsProps({ mode: "ranking" }))
    );
    const social = render(
      createElement(LeaderboardsTab, makeLeaderboardsProps({ mode: "social" }))
    );

    expect(ranking).toContain("榜单还空着");
    expect(ranking).not.toContain("没有私信，没有动态");
    expect(social).toContain("没有私信，没有动态");
    expect(social).toContain("好友码");
  });

  it("keeps overview, achievements, rewards, and sign-out separated", () => {
    const overview = render(
      createElement(ProfileTab, makeProfileProps({ mode: "overview" }))
    );
    const achievements = render(
      createElement(ProfileTab, makeProfileProps({ mode: "achievements" }))
    );
    const rewards = render(
      createElement(ProfileTab, makeProfileProps({ mode: "rewards" }))
    );

    expect(overview).toContain("休息连续性");
    expect(overview).not.toContain("退出当前账号");
    expect(achievements).toContain("成就墙");
    expect(achievements).toContain("这个分类还没有成就");
    expect(rewards).toContain("奖励墙");
    expect(rewards).toContain("退出当前账号");
  });

  it("preserves leaderboard suppression privacy copy", () => {
    const companySuppressed = render(
      createElement(
        LeaderboardsTab,
        makeLeaderboardsProps({
          mode: "ranking",
          scope: "company",
          leaderboard: {
            window: "daily",
            windowStart: new Date().toISOString(),
            scope: "company",
            suppressed: true,
            suppressionReason: "COMPANY_TOO_SMALL",
            items: [],
            currentUser: null
          } as any
        })
      )
    );

    expect(companySuppressed).toContain("公司榜还差几位");
    expect(companySuppressed).toContain("至少需要 3 位成员");
  });

  it("renders achievement filters and cosmetic equip states", () => {
    const achievement = {
      id: "achievement-1",
      code: "rest-once",
      name: "合法休息一次",
      description: "完成一次合法休息",
      ruleType: "activity_count",
      rewardConfig: {},
      progress: { current: 0, target: 1, unit: "count", percent: 0, completed: false },
      category: "activity",
      rarity: "common",
      unlockSummary: "还差 1 次",
      recommendationWeight: 1,
      todayFriendly: true,
      actionHint: { section: "activities", label: "去活动" },
      unlockedAt: null,
      rewardClaimedAt: null,
      recommendationGroup: "today",
      recommendationReason: "马上完成",
      remainingEffortLabel: "还差 1 次",
      targetSection: "activities"
    } as any;
    const filtered = render(
      createElement(
        ProfileTab,
        makeProfileProps({
          mode: "achievements",
          categoryFilter: "social" as any,
          achievementList: {
            achievements: [achievement],
            recommendations: { today: [achievement], nearest: [], long_term: [] }
          } as any
        })
      )
    );
    const rewards = render(
      createElement(
        ProfileTab,
        makeProfileProps({
          mode: "rewards",
          cosmeticInventory: {
            equippedTitle: { id: "title-1", name: "会议潜水员" },
            equippedBadge: null,
            cosmetics: [
              {
                id: "title-1",
                name: "会议潜水员",
                cosmeticType: "title",
                rarity: "rare",
                description: "已经装备",
                owned: true,
                equipped: true,
                unlockedAt: new Date().toISOString()
              },
              {
                id: "badge-locked",
                name: "工位幽灵",
                cosmeticType: "badge",
                rarity: "epic",
                description: "继续休息后解锁",
                owned: false,
                equipped: false,
                unlockedAt: null
              }
            ]
          } as any
        })
      )
    );

    expect(filtered).toContain("社交");
    expect(filtered).toContain("这个分类还没有成就");
    expect(rewards).toContain("会议潜水员");
    expect(rewards).toContain("使用中");
    expect(rewards).toContain("工位幽灵");
    expect(rewards).toContain("未解锁");
  });
});

describe("mode navigation state safety", () => {
  it("renders every local mode without invoking mutations or changing shared state", () => {
    const activityMutation = vi.fn();
    const activities = makeActivitiesProps();
    activities.actions.completeActivity = activityMutation;
    activities.progress = { completedStepIds: ["draft-step"] };
    activities.skipReason = "want_weirder";

    const beanMutation = vi.fn();
    const beans = makeBeansProps();
    beans.actions.drawBean = beanMutation;
    beans.selectedTheme = "daydream";
    beans.showcasePosition = 3;
    beans.drawResult = {
      bean: { id: "retained", name: "保留豆", theme: "daydream", rarity: "common", description: "" },
      duplicate: false,
      pityTriggered: false,
      fragmentsGranted: 0,
      remainingDrawChances: 0,
      fishTankOutcomes: []
    } as any;

    const socialMutation = vi.fn();
    const leaderboards = makeLeaderboardsProps();
    leaderboards.actions.submitSocialAction = socialMutation;
    leaderboards.socialInput = "FRIEND-KEEP";

    const equipMutation = vi.fn();
    const profile = makeProfileProps();
    profile.actions.equipCosmetic = equipMutation;
    profile.categoryFilter = "social" as any;

    for (const mode of ["play", "history"] as const) {
      render(createElement(ActivitiesTab, { ...activities, mode }));
    }
    for (const mode of ["tank", "draw", "collection"] as const) {
      render(createElement(BeansTab, { ...beans, mode }));
    }
    for (const mode of ["ranking", "social"] as const) {
      render(createElement(LeaderboardsTab, { ...leaderboards, mode }));
    }
    for (const mode of ["overview", "achievements", "rewards"] as const) {
      render(createElement(ProfileTab, { ...profile, mode }));
    }

    expect(activities.progress).toEqual({ completedStepIds: ["draft-step"] });
    expect(activities.skipReason).toBe("want_weirder");
    expect(beans.selectedTheme).toBe("daydream");
    expect(beans.showcasePosition).toBe(3);
    expect(beans.drawResult?.bean.name).toBe("保留豆");
    expect(leaderboards.socialInput).toBe("FRIEND-KEEP");
    expect(profile.categoryFilter).toBe("social");
    expect(activityMutation).not.toHaveBeenCalled();
    expect(beanMutation).not.toHaveBeenCalled();
    expect(socialMutation).not.toHaveBeenCalled();
    expect(equipMutation).not.toHaveBeenCalled();
  });
});
