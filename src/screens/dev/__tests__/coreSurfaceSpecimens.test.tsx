import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ThemeProvider } from "../../../ui/theme/ThemeProvider";
import { CoreSurfaceSpecimens } from "../CoreSurfaceSpecimens";

describe("CoreSurfaceSpecimens", () => {
  it("exposes every mode, semantic landing, scoped error, reduced-motion cue, and viewport width", () => {
    const markup = renderToStaticMarkup(
      createElement(ThemeProvider, null, createElement(CoreSurfaceSpecimens))
    );

    for (const label of [
      "Play mode",
      "History mode",
      "Tank mode",
      "Draw mode",
      "Collection mode",
      "Ranking mode",
      "Social mode",
      "Overview",
      "Achievements",
      "Rewards"
    ]) {
      expect(markup).toContain(label);
    }
    for (const landing of [
      "当前活动",
      "活动历史",
      "鱼缸",
      "抽豆结果",
      "豆子收藏",
      "排行榜",
      "社交管理",
      "成就",
      "装扮奖励"
    ]) {
      expect(markup).toContain(landing);
    }
    expect(markup).toContain("activities:history scoped error");
    expect(markup).toContain("beans:draw scoped error");
    expect(markup).toContain("减弱动态");
    expect(markup).toContain("360px viewport specimen");
    expect(markup).toContain("390px viewport specimen");
    expect(markup).toContain("640px viewport specimen");
    expect(markup).toContain("当前推荐与进行中的任务");
    expect(markup).toContain("持久错误标本");
  });
});
