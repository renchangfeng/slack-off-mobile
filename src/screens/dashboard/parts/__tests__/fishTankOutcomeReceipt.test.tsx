import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ThemeProvider } from "../../../../ui/theme/ThemeProvider";
import {
  buildFishTankOutcomeRows,
  FishTankOutcomeReceipt
} from "../fishTankOutcomeReceipt";
import type { FishTankResourceOutcome } from "../../../../api/fishTank";

function render(component: React.ReactNode) {
  return renderToStaticMarkup(createElement(ThemeProvider, null, component));
}

describe("buildFishTankOutcomeRows", () => {
  it("returns null for empty, null, or undefined outcomes", () => {
    expect(buildFishTankOutcomeRows([])).toBeNull();
    expect(buildFishTankOutcomeRows(null)).toBeNull();
    expect(buildFishTankOutcomeRows(undefined)).toBeNull();
  });

  it("builds rows with signed quantities and bounded values", () => {
    const outcomes: FishTankResourceOutcome[] = [
      { resourceType: "food", quantity: 1, label: "鱼粮", copy: "打卡完成，鱼粮 +1。" },
      { resourceType: "bubble", quantity: 3, label: "气泡", copy: "活动完成，气泡 +3。" },
      {
        resourceType: "hatch_progress",
        quantity: 1001,
        label: "孵化进度",
        copy: "进度已溢出。"
      }
    ];
    const rows = buildFishTankOutcomeRows(outcomes);
    expect(rows).toHaveLength(3);
    expect(rows?.[0]).toMatchObject({
      resourceType: "food",
      label: "鱼粮",
      displayQuantity: "+1",
      icon: "🍥",
      artKey: "fish-tank-resource-food"
    });
    expect(rows?.[1]).toMatchObject({
      resourceType: "bubble",
      label: "气泡",
      displayQuantity: "+3",
      icon: "🫧",
      artKey: "fish-tank-resource-bubble"
    });
    expect(rows?.[2]).toMatchObject({
      resourceType: "hatch_progress",
      displayQuantity: "+999",
      artKey: "fish-tank-resource-hatch-progress"
    });
  });

  it("clamps negative quantities to zero", () => {
    const rows = buildFishTankOutcomeRows([
      { resourceType: "food", quantity: -2, label: "鱼粮", copy: "不应出现负值。" }
    ]);
    expect(rows?.[0].displayQuantity).toBe("0");
  });
});

describe("FishTankOutcomeReceipt", () => {
  it("renders nothing when outcomes are empty", () => {
    const markup = render(
      createElement(FishTankOutcomeReceipt, { outcomes: [] })
    );
    expect(markup).toBe("");
  });

  it("renders a compact receipt row per resource", () => {
    const outcomes: FishTankResourceOutcome[] = [
      { resourceType: "food", quantity: 1, label: "鱼粮", copy: "打卡完成，鱼粮 +1。" }
    ];
    const markup = render(
      createElement(FishTankOutcomeReceipt, { outcomes, testID: "receipt" })
    );
    expect(markup).toContain("鱼缸奖励");
    expect(markup).toContain("鱼粮");
    expect(markup).toContain("+1");
    expect(markup).toContain("打卡完成，鱼粮 +1。");
  });

  it("renders multiple resource rows", () => {
    const outcomes: FishTankResourceOutcome[] = [
      { resourceType: "food", quantity: 1, label: "鱼粮", copy: "鱼粮 +1。" },
      { resourceType: "bubble", quantity: 1, label: "气泡", copy: "气泡 +1。" }
    ];
    const markup = render(
      createElement(FishTankOutcomeReceipt, { outcomes })
    );
    expect(markup).toContain("鱼粮");
    expect(markup).toContain("气泡");
  });
});
