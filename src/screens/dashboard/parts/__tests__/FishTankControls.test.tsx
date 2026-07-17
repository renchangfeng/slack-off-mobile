import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ThemeProvider } from "../../../../ui/theme/ThemeProvider";
import { FishTankControls } from "../FishTankControls";
import type { FishTankSummary } from "../../../../api/fishTank";

function render(component: React.ReactNode) {
  return renderToStaticMarkup(createElement(ThemeProvider, null, component));
}

function makeSummary(
  partial: Partial<FishTankSummary> & Pick<FishTankSummary, "initialized">
): FishTankSummary {
  return {
    fish: [],
    displayedFish: [],
    eligibleFish: [],
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
    collection: { owned: 0, total: 3, percent: 0, complete: false, items: [] },
    resourceSummary: {
      resources: [
        { resourceType: "food", quantity: 0, label: "鱼食" },
        { resourceType: "bubble", quantity: 0, label: "气泡" },
        { resourceType: "hatch_progress", quantity: 0, label: "孵化进度" }
      ],
      totalFood: 0,
      totalBubbles: 0,
      totalHatchProgress: 0
    },
    costs: { feed: 1, bubble: 1 },
    guidance: { foodSource: "draw", bubbleSource: "draw" },
    nextAction: "companionship",
    ...partial
  } as FishTankSummary;
}

describe("FishTankControls", () => {
  it("renders companionship fallback when no care is available", () => {
    const summary = makeSummary({
      initialized: true,
      careAvailability: {
        feed: { available: false, nextAvailableAt: null, cooldownRemainingSeconds: 60 },
        bubble: { available: false, nextAvailableAt: null, cooldownRemainingSeconds: 120 }
      },
      resourceSummary: {
        resources: [],
        totalFood: 0,
        totalBubbles: 0,
        totalHatchProgress: 0
      }
    });
    const markup = render(
      createElement(FishTankControls, {
        summary,
        loading: false,
        bubbleLoading: false,
        hatchLoading: false,
        nowMs: Date.now(),
        cooldownReceivedAtMs: Date.now(),
        onFeed: () => undefined,
        onBubble: () => undefined,
        onHatch: () => undefined,
        onOpenPicker: () => undefined,
        onOpenDecor: () => undefined
      })
    );
    expect(markup).toContain("一起发呆");
  });

  it("renders feed primary action when feed is available and resourced", () => {
    const summary = makeSummary({
      initialized: true,
      careAvailability: {
        feed: { available: true, nextAvailableAt: null, cooldownRemainingSeconds: 0 },
        bubble: { available: true, nextAvailableAt: null, cooldownRemainingSeconds: 0 }
      },
      resourceSummary: {
        resources: [
          { resourceType: "food", quantity: 2, label: "鱼食" },
          { resourceType: "bubble", quantity: 0, label: "气泡" }
        ],
        totalFood: 2,
        totalBubbles: 0,
        totalHatchProgress: 0
      }
    });
    const markup = render(
      createElement(FishTankControls, {
        summary,
        loading: false,
        bubbleLoading: false,
        hatchLoading: false,
        nowMs: Date.now(),
        cooldownReceivedAtMs: Date.now(),
        onFeed: () => undefined,
        onBubble: () => undefined,
        onHatch: () => undefined,
        onOpenPicker: () => undefined,
        onOpenDecor: () => undefined
      })
    );
    expect(markup).toContain("投喂小鱼");
  });

  it("renders bubble primary action when feed is unavailable", () => {
    const summary = makeSummary({
      initialized: true,
      careAvailability: {
        feed: { available: false, nextAvailableAt: null, cooldownRemainingSeconds: 60 },
        bubble: { available: true, nextAvailableAt: null, cooldownRemainingSeconds: 0 }
      },
      resourceSummary: {
        resources: [
          { resourceType: "food", quantity: 0, label: "鱼食" },
          { resourceType: "bubble", quantity: 2, label: "气泡" }
        ],
        totalFood: 0,
        totalBubbles: 2,
        totalHatchProgress: 0
      }
    });
    const markup = render(
      createElement(FishTankControls, {
        summary,
        loading: false,
        bubbleLoading: false,
        hatchLoading: false,
        nowMs: Date.now(),
        cooldownReceivedAtMs: Date.now(),
        onFeed: () => undefined,
        onBubble: () => undefined,
        onHatch: () => undefined,
        onOpenPicker: () => undefined,
        onOpenDecor: () => undefined
      })
    );
    expect(markup).toContain("吹个气泡");
  });

  it("renders hatch error when provided", () => {
    const summary = makeSummary({ initialized: true });
    const markup = render(
      createElement(FishTankControls, {
        summary,
        loading: false,
        bubbleLoading: false,
        hatchLoading: false,
        hatchError: "孵化没有成功，请稍后重试。",
        nowMs: Date.now(),
        cooldownReceivedAtMs: Date.now(),
        onFeed: () => undefined,
        onBubble: () => undefined,
        onHatch: () => undefined,
        onOpenPicker: () => undefined,
        onOpenDecor: () => undefined
      })
    );
    expect(markup).toContain("孵化没有成功，请稍后重试。");
  });

  it("always renders food, bubble, and hatch progress even at zero", () => {
    const summary = makeSummary({ initialized: true });
    const markup = render(
      createElement(FishTankControls, {
        summary,
        loading: false,
        bubbleLoading: false,
        hatchLoading: false,
        nowMs: Date.now(),
        cooldownReceivedAtMs: Date.now(),
        onFeed: () => undefined,
        onBubble: () => undefined,
        onHatch: () => undefined,
        onOpenPicker: () => undefined,
        onOpenDecor: () => undefined
      })
    );
    expect(markup).toContain("鱼食");
    expect(markup).toContain("气泡");
    expect(markup).toContain("孵化进度");
    expect(markup).toContain("0/3 孵化进度");
  });
});
