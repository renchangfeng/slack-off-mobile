import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  CORE_SURFACE_MIN_TOUCH_TARGET,
  CoreSurfaceGrid,
  DurableReceipt,
  SummaryCard
} from "../CoreSurface";
import {
  SECTION_SWITCHER_MIN_TOUCH_TARGET,
  SectionSwitcher
} from "../SectionSwitcher";
import { ThemeProvider } from "../theme/ThemeProvider";
import { calmOfficeTheme, pixelRestTheme } from "../theme/themes";

function render(component: React.ReactNode, themeId = "pixel-rest") {
  return renderToStaticMarkup(
    createElement(ThemeProvider, { initialThemeId: themeId, children: component })
  );
}

describe("SectionSwitcher", () => {
  it("renders localized tab semantics, selected state, position, and long labels", () => {
    const markup = render(
      createElement(SectionSwitcher, {
        options: [
          { value: "current", label: "当前推荐与进行中的任务" },
          { value: "history", label: "历史记录与今日洞察" }
        ],
        selected: "history",
        onSelect: vi.fn(),
        accessibilityLabel: "活动分区"
      })
    );

    expect(markup).toContain('role="tablist"');
    expect(markup).toContain('aria-label="活动分区"');
    expect(markup).toContain('role="tab"');
    expect(markup).toContain('aria-selected="true"');
    expect(markup).toContain('aria-posinset="2"');
    expect(markup).toContain('aria-setsize="2"');
    expect(markup).toContain("当前推荐与进行中的任务");
    expect(markup).toContain("历史记录与今日洞察");
    expect(markup).not.toContain("line-clamp");
    expect(markup.indexOf("当前推荐与进行中的任务")).toBeLessThan(
      markup.indexOf("历史记录与今日洞察")
    );
    expect(markup.match(/tabindex="0"/g)?.length).toBe(2);
    expect(SECTION_SWITCHER_MIN_TOUCH_TARGET).toBe(44);
  });

  it("exposes disabled state and renders under both registered themes", () => {
    for (const themeId of ["pixel-rest", "calm-office"]) {
      const markup = render(
        createElement(SectionSwitcher, {
          options: [
            { value: "tank", label: "鱼缸" },
            { value: "draw", label: "抽豆" },
            { value: "collection", label: "收藏" }
          ],
          selected: "tank",
          onSelect: vi.fn(),
          disabled: true
        }),
        themeId
      );
      expect(markup).toContain('aria-disabled="true"');
      expect(markup).toContain("鱼缸");
      expect(markup).toContain("收藏");
    }
  });
});

describe("core-surface hierarchy primitives", () => {
  it("renders long summaries, reachable actions, and durable receipts", () => {
    const markup = render(
      createElement(
        CoreSurfaceGrid,
        null,
        createElement(SummaryCard, {
          title: "一段用于检查动态文字放大和长中文换行能力的摘要标题",
          status: "状态说明也故意写得更长，确保窄屏不会被单行撑开。",
          actionLabel: "查看完整详情",
          onAction: vi.fn()
        }),
        createElement(DurableReceipt, {
          title: "操作结果",
          outcome: "奖励已到账，可以继续前往鱼缸查看。",
          nextActionLabel: "前往鱼缸",
          onNext: vi.fn(),
          onDismiss: vi.fn()
        })
      )
    );

    expect(markup).toContain("一段用于检查动态文字放大和长中文换行能力的摘要标题");
    expect(markup).toContain("查看完整详情");
    expect(markup).toContain("奖励已到账，可以继续前往鱼缸查看。");
    expect(markup).toContain('aria-label="关闭"');
    expect(markup.match(/role="button"/g)?.length).toBeGreaterThanOrEqual(3);
    expect(CORE_SURFACE_MIN_TOUCH_TARGET).toBe(44);
  });

  it("keeps core text and button pairs at WCAG AA contrast in every theme", () => {
    for (const theme of [pixelRestTheme, calmOfficeTheme]) {
      expect(contrastRatio(theme.colors.text, theme.colors.surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(theme.colors.textMuted, theme.colors.surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(theme.colors.primary, theme.colors.surface)).toBeGreaterThanOrEqual(4.5);
    }
  });
});

function contrastRatio(foreground: string, background: string): number {
  const left = relativeLuminance(foreground);
  const right = relativeLuminance(background);
  return (Math.max(left, right) + 0.05) / (Math.min(left, right) + 0.05);
}

function relativeLuminance(hex: string): number {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)!
    .map((value) => Number.parseInt(value, 16) / 255)
    .map((value) =>
      value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
    );
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}
