import { describe, expect, it } from "vitest";
import {
  deriveCollectionPreview,
  deriveHatchButtonLabel,
  deriveHatchProgressLabel,
  deriveHatchResultPresentation,
  deriveHatchUiState
} from "../fishTankHelpers";
import type { FishTankSummary, HatchResult } from "../../../../api/fishTank";

function makeSummary(
  partial: Partial<FishTankSummary> & Pick<FishTankSummary, "initialized" | "fish" | "nextAction">
): FishTankSummary {
  return {
    moodCopy: "小鱼正在假装工作。",
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
