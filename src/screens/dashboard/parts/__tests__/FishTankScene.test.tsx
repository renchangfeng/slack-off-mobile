import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ThemeProvider } from "../../../../ui/theme/ThemeProvider";
import { FishTankScene } from "../FishTankScene";
import type { FishTankSummary } from "../../../../api/fishTank";

function render(component: React.ReactNode) {
  return renderToStaticMarkup(createElement(ThemeProvider, null, component));
}

function makeFish(id: string, name: string) {
  return {
    id,
    definitionId: `def-${id}`,
    name,
    rarity: "common" as const,
    theme: "office" as const,
    personality: "发呆",
    artKey: "fish-tank-fish",
    acquiredSource: "starter" as const,
    createdAt: new Date().toISOString()
  };
}

function makeSummary(displayedFish: ReturnType<typeof makeFish>[]): FishTankSummary {
  return {
    initialized: true,
    fish: displayedFish,
    displayedFish,
    eligibleFish: displayedFish,
    moodCopy: "小鱼正在假装工作。",
    mood: {
      code: "idle",
      title: "一起发呆",
      copy: "小鱼正在假装工作。",
      ambientArtKey: "tank-mood-idle"
    },
    decorations: { equipped: [], inventory: [] },
    careAvailability: {
      feed: { available: true, nextAvailableAt: null, cooldownRemainingSeconds: 0 },
      bubble: { available: true, nextAvailableAt: null, cooldownRemainingSeconds: 0 }
    },
    hatchAvailability: {
      available: false,
      reason: "insufficient_progress",
      currentProgress: 0,
      cost: 3,
      missingProgress: 3
    },
    collection: { owned: 1, total: 3, percent: 33, complete: false, items: [] },
    resourceSummary: {
      resources: [],
      totalFood: 0,
      totalBubbles: 0,
      totalHatchProgress: 0
    },
    costs: { feed: 1, bubble: 1 },
    guidance: { foodSource: "draw", bubbleSource: "draw" },
    nextAction: "companionship"
  } as FishTankSummary;
}

describe("FishTankScene", () => {
  it("renders empty tank fallback when no fish are displayed", () => {
    const markup = render(
      createElement(FishTankScene, {
        summary: makeSummary([]),
        onCompanionship: () => undefined,
        companionshipCopy: null
      })
    );
    expect(markup).toContain("像素休息风空鱼缸");
  });

  it("renders one displayed fish", () => {
    const markup = render(
      createElement(FishTankScene, {
        summary: makeSummary([makeFish("f1", "摸摸")]),
        onCompanionship: () => undefined,
        companionshipCopy: null
      })
    );
    expect(markup).toContain("摸摸");
  });

  it("renders up to three displayed fish", () => {
    const markup = render(
      createElement(FishTankScene, {
        summary: makeSummary([
          makeFish("f1", "摸摸"),
          makeFish("f2", "泡泡"),
          makeFish("f3", "静静")
        ]),
        onCompanionship: () => undefined,
        companionshipCopy: null
      })
    );
    expect(markup).toContain("摸摸");
    expect(markup).toContain("泡泡");
    expect(markup).toContain("静静");
  });

  it("renders companionship copy when provided", () => {
    const markup = render(
      createElement(FishTankScene, {
        summary: makeSummary([makeFish("f1", "摸摸")]),
        onCompanionship: () => undefined,
        companionshipCopy: "小鱼没说什么，但水面平静了一点。"
      })
    );
    expect(markup).toContain("小鱼没说什么，但水面平静了一点。");
  });
});
