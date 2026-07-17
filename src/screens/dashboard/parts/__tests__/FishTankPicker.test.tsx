import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ThemeProvider } from "../../../../ui/theme/ThemeProvider";
import { FishTankPicker } from "../FishTankPicker";
import type { FishTankFish, FishTankSummary } from "../../../../api/fishTank";

function render(component: React.ReactNode) {
  return renderToStaticMarkup(createElement(ThemeProvider, null, component));
}

function makeFish(id: string, name: string): FishTankFish {
  return {
    id,
    definitionId: `def-${id}`,
    name,
    rarity: "common",
    theme: "office",
    personality: "发呆",
    artKey: "fish-tank-fish",
    acquiredSource: "starter",
    createdAt: new Date().toISOString()
  };
}

function makeSummary(displayedFish: FishTankFish[], eligibleFish: FishTankFish[]): FishTankSummary {
  return {
    initialized: true,
    fish: eligibleFish,
    displayedFish,
    eligibleFish,
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

describe("FishTankPicker", () => {
  it("renders capacity label and eligible fish", () => {
    const fish = [makeFish("f1", "摸摸")];
    const markup = render(
      createElement(FishTankPicker, {
        summary: makeSummary(fish, fish),
        draft: null,
        loading: false,
        onChangeDraft: () => undefined,
        onSave: () => undefined,
        onClose: () => undefined
      })
    );
    expect(markup).toContain("选择最多 3 条小鱼 · 1/3");
    expect(markup).toContain("摸摸");
  });

  it("shows save button when draft differs from authoritative order", () => {
    const fish = [makeFish("f1", "摸摸"), makeFish("f2", "泡泡")];
    const markup = render(
      createElement(FishTankPicker, {
        summary: makeSummary([fish[0]], fish),
        draft: [fish[1]],
        loading: false,
        onChangeDraft: () => undefined,
        onSave: () => undefined,
        onClose: () => undefined
      })
    );
    expect(markup).toContain("保存展示顺序");
  });

  it("does not show save button when draft matches authoritative order", () => {
    const fish = [makeFish("f1", "摸摸")];
    const markup = render(
      createElement(FishTankPicker, {
        summary: makeSummary(fish, fish),
        draft: null,
        loading: false,
        onChangeDraft: () => undefined,
        onSave: () => undefined,
        onClose: () => undefined
      })
    );
    expect(markup).not.toContain("保存展示顺序");
  });

  it("marks selected fish with position badge", () => {
    const fish = [makeFish("f1", "摸摸")];
    const markup = render(
      createElement(FishTankPicker, {
        summary: makeSummary(fish, fish),
        draft: null,
        loading: false,
        onChangeDraft: () => undefined,
        onSave: () => undefined,
        onClose: () => undefined
      })
    );
    expect(markup).toContain("第 1 位");
  });
});
