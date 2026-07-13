import { describe, expect, it } from "vitest";
import {
  deriveCollectionPreview,
  deriveDecorItemAction,
  deriveDecorSlotGroups,
  deriveEquipResultPresentation,
  deriveHatchButtonLabel,
  deriveHatchProgressLabel,
  deriveHatchResultPresentation,
  deriveHatchUiState,
  deriveMoodPresentation
} from "../fishTankHelpers";
import type { DecorationInventoryItem, EquipDecorationResult, FishTankSummary, HatchResult } from "../../../../api/fishTank";

function makeSummary(
  partial: Partial<FishTankSummary> & Pick<FishTankSummary, "initialized" | "fish" | "nextAction">
): FishTankSummary {
  return {
    moodCopy: "小鱼正在假装工作。",
    mood: {
      code: "idle",
      title: "一起发呆",
      copy: "小鱼正在假装工作。",
      ambientArtKey: "tank-mood-idle"
    },
    decorations: {
      equipped: [],
      inventory: []
    },
    careAvailability: {
      feed: { available: true, nextAvailableAt: null, cooldownRemainingSeconds: 0 }
    },
    hatchAvailability: {
      available: false,
      reason: "insufficient_progress",
      currentProgress: 0,
      cost: 3,
      missingProgress: 3
    },
    collection: {
      owned: 1,
      total: 5,
      percent: 20,
      complete: false,
      items: [
        {
          definitionId: "def-1",
          name: "摸摸",
          rarity: "common",
          personality: "假装工作的",
          artKey: "fish-tank-fish",
          sourceHint: "starter",
          owned: true
        },
        {
          definitionId: "def-2",
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
      totalFood: 0,
      totalBubbles: 0,
      totalHatchProgress: 0
    },
    ...partial
  };
}

describe("deriveHatchUiState", () => {
  it("returns uninitialized when summary is null", () => {
    expect(deriveHatchUiState(null, false)).toEqual({ kind: "uninitialized" });
  });

  it("returns loading when loading is true", () => {
    const summary = makeSummary({ initialized: true, fish: [], nextAction: "wait" });
    expect(deriveHatchUiState(summary, true)).toEqual({ kind: "loading" });
  });

  it("returns insufficient when progress is below cost", () => {
    const summary = makeSummary({
      initialized: true,
      fish: [],
      nextAction: "wait",
      hatchAvailability: {
        available: false,
        reason: "insufficient_progress",
        currentProgress: 1,
        cost: 3,
        missingProgress: 2
      }
    });
    expect(deriveHatchUiState(summary, false)).toEqual({
      kind: "insufficient",
      current: 1,
      cost: 3,
      missing: 2
    });
  });

  it("returns ready when hatch availability is true", () => {
    const summary = makeSummary({
      initialized: true,
      fish: [],
      nextAction: "hatch",
      hatchAvailability: {
        available: true,
        reason: "ready",
        currentProgress: 3,
        cost: 3,
        missingProgress: 0
      }
    });
    expect(deriveHatchUiState(summary, false)).toEqual({
      kind: "ready",
      current: 3,
      cost: 3
    });
  });

  it("returns complete when catalog is complete", () => {
    const summary = makeSummary({
      initialized: true,
      fish: [],
      nextAction: "wait",
      hatchAvailability: {
        available: false,
        reason: "catalog_complete",
        currentProgress: 3,
        cost: 3,
        missingProgress: 0
      },
      collection: { owned: 5, total: 5, percent: 100, complete: true, items: [] }
    });
    expect(deriveHatchUiState(summary, false)).toEqual({
      kind: "complete",
      owned: 5,
      total: 5
    });
  });
});

describe("deriveHatchProgressLabel", () => {
  it("labels ready state", () => {
    expect(deriveHatchProgressLabel({ kind: "ready", current: 3, cost: 3 })).toBe("3/3 可孵化");
  });

  it("labels insufficient state", () => {
    expect(deriveHatchProgressLabel({ kind: "insufficient", current: 1, cost: 3, missing: 2 })).toBe(
      "1/3 孵化进度"
    );
  });

  it("labels complete state", () => {
    expect(deriveHatchProgressLabel({ kind: "complete", owned: 5, total: 5 })).toBe("图鉴已集齐");
  });

  it("labels uninitialized state", () => {
    expect(deriveHatchProgressLabel({ kind: "uninitialized" })).toBe("先放入第一条小鱼");
  });

  it("labels loading state", () => {
    expect(deriveHatchProgressLabel({ kind: "loading" })).toBe("加载中…");
  });
});

describe("deriveHatchButtonLabel", () => {
  it("labels ready state", () => {
    expect(deriveHatchButtonLabel({ kind: "ready", current: 3, cost: 3 })).toBe("孵化新邻居");
  });

  it("labels insufficient state", () => {
    expect(deriveHatchButtonLabel({ kind: "insufficient", current: 1, cost: 3, missing: 2 })).toBe(
      "还差 2 进度"
    );
  });

  it("labels complete state", () => {
    expect(deriveHatchButtonLabel({ kind: "complete", owned: 5, total: 5 })).toBe("图鉴已完成");
  });

  it("labels uninitialized state", () => {
    expect(deriveHatchButtonLabel({ kind: "uninitialized" })).toBe("先初始化鱼缸");
  });

  it("labels loading state", () => {
    expect(deriveHatchButtonLabel({ kind: "loading" })).toBe("孵化中…");
  });
});

describe("deriveHatchResultPresentation", () => {
  it("returns null when result is null", () => {
    expect(deriveHatchResultPresentation(null)).toBeNull();
  });

  it("maps discovered fish fields", () => {
    const result: HatchResult = {
      success: true,
      replayed: false,
      discoveredFish: {
        id: "fish-2",
        definitionId: "def-2",
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
      tank: null as never
    };
    const presentation = deriveHatchResultPresentation(result);
    expect(presentation).toMatchObject({
      title: "新鱼登场",
      copy: "从进度里游了出来。",
      nextHint: "返回鱼缸看看。",
      replayed: false,
      cost: 3,
      outcomeCode: "DISCOVERED",
      fishName: "打印机和平贝塔",
      fishRarity: "common",
      fishPersonality: "宽容卡纸的"
    });
  });
});

describe("deriveCollectionPreview", () => {
  it("returns empty array when summary is null", () => {
    expect(deriveCollectionPreview(null)).toEqual([]);
  });

  it("returns collection items", () => {
    const summary = makeSummary({ initialized: true, fish: [], nextAction: "wait" });
    expect(deriveCollectionPreview(summary)).toEqual([
      {
        definitionId: "def-1",
        owned: true,
        name: "摸摸",
        sourceHint: "starter"
      },
      {
        definitionId: "def-2",
        owned: false,
        name: null,
        sourceHint: "hatch"
      }
    ]);
  });
});

describe("deriveMoodPresentation", () => {
  it("returns idle fallback when mood is missing", () => {
    expect(deriveMoodPresentation(null)).toMatchObject({
      code: "idle",
      title: "一起发呆"
    });
  });

  it("passes through mood fields", () => {
    expect(
      deriveMoodPresentation({
        code: "cozy",
        title: "吃饱发呆",
        copy: "吃饱了。",
        ambientArtKey: "tank-mood-cozy"
      })
    ).toEqual({
      code: "cozy",
      title: "吃饱发呆",
      copy: "吃饱了。",
      ambientArtKey: "tank-mood-cozy"
    });
  });
});

function makeDecorItem(
  partial: Partial<DecorationInventoryItem> & Pick<DecorationInventoryItem, "definitionId" | "slot">
): DecorationInventoryItem {
  return {
    code: "decor",
    name: "装饰",
    type: partial.slot,
    rarity: "common",
    artKey: "tank-prop-empty",
    unlockHint: "解锁提示",
    owned: true,
    equipped: false,
    ...partial
  } as DecorationInventoryItem;
}

describe("deriveDecorSlotGroups", () => {
  it("returns empty array when summary has no inventory", () => {
    expect(deriveDecorSlotGroups(null)).toEqual([]);
  });

  it("groups owned and locked items by slot", () => {
    const summary = makeSummary({
      initialized: true,
      fish: [],
      nextAction: "wait",
      decorations: {
        equipped: [],
        inventory: [
          makeDecorItem({ definitionId: "bg-1", slot: "background", owned: true, equipped: false }),
          makeDecorItem({ definitionId: "bg-2", slot: "background", owned: false, equipped: false }),
          makeDecorItem({ definitionId: "plant-1", slot: "plant", owned: true, equipped: false })
        ]
      }
    });
    const groups = deriveDecorSlotGroups(summary);
    expect(groups.map((g) => g.slot)).toEqual(["background", "plant", "prop", "ambient"]);
    const bg = groups.find((g) => g.slot === "background")!;
    expect(bg.items).toHaveLength(2);
    expect(bg.items[0].owned).toBe(true);
  });

  it("marks equipped item and derives default for missing slot", () => {
    const summary = makeSummary({
      initialized: true,
      fish: [],
      nextAction: "wait",
      decorations: {
        equipped: [
          {
            slot: "background",
            definitionId: "bg-1",
            code: "bg_1",
            name: "背景",
            type: "background",
            rarity: "common",
            artKey: "tank-bg-default"
          }
        ],
        inventory: [
          makeDecorItem({
            definitionId: "bg-1",
            slot: "background",
            owned: true,
            equipped: true,
            code: "bg_1",
            name: "背景",
            type: "background",
            rarity: "common",
            artKey: "tank-bg-default"
          })
        ]
      }
    });
    const groups = deriveDecorSlotGroups(summary);
    const bg = groups.find((g) => g.slot === "background")!;
    expect(bg.equipped?.definitionId).toBe("bg-1");
  });

  it("preserves a historical equipped item that is absent from active inventory", () => {
    const groups = deriveDecorSlotGroups(
      makeSummary({
        initialized: true,
        fish: [],
        nextAction: "wait",
        decorations: {
          inventory: [],
          equipped: [
            {
              slot: "background",
              definitionId: "inactive-bg",
              code: "retired_background",
              name: "旧日窗景",
              type: "background",
              rarity: "rare",
              artKey: "tank-bg-office-window"
            }
          ]
        }
      })
    );

    expect(groups.find((group) => group.slot === "background")?.equipped).toMatchObject({
      definitionId: "inactive-bg",
      equipped: true,
      owned: true
    });
  });
});

describe("deriveDecorItemAction", () => {
  it("returns equipped state", () => {
    expect(deriveDecorItemAction(makeDecorItem({ definitionId: "d1", slot: "plant", equipped: true }))).toEqual({
      actionable: false,
      actionLabel: "已装备",
      state: "equipped"
    });
  });

  it("returns owned actionable state", () => {
    expect(deriveDecorItemAction(makeDecorItem({ definitionId: "d1", slot: "plant", owned: true }))).toEqual({
      actionable: true,
      actionLabel: "装备",
      state: "owned"
    });
  });

  it("returns locked state", () => {
    expect(deriveDecorItemAction(makeDecorItem({ definitionId: "d1", slot: "plant", owned: false }))).toEqual({
      actionable: false,
      actionLabel: "未解锁",
      state: "locked"
    });
  });
});

describe("deriveEquipResultPresentation", () => {
  it("returns null when result is null", () => {
    expect(deriveEquipResultPresentation(null)).toBeNull();
  });

  it("maps equip result fields", () => {
    const result: EquipDecorationResult = {
      success: true,
      replayed: false,
      outcomeCode: "EQUIPPED",
      resultTitle: "装扮已更换",
      resultCopy: "已经放进鱼缸。",
      equipped: {
        slot: "background",
        definitionId: "def-bg",
        code: "bg",
        name: "背景",
        type: "background",
        rarity: "rare",
        artKey: "tank-bg-office-window"
      },
      tank: null as never
    };
    expect(deriveEquipResultPresentation(result)).toMatchObject({
      title: "装扮已更换",
      copy: "已经放进鱼缸。",
      replayed: false,
      equippedName: "背景",
      equippedSlot: "background",
      equippedArtKey: "tank-bg-office-window"
    });
  });
});
