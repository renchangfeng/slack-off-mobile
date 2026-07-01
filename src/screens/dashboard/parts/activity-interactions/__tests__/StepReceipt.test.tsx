import { describe, expect, it } from "vitest";
import { formatStepReceipt } from "../formatStepReceipt";

describe("formatStepReceipt", () => {
  it("returns all summaries and zero overflow when 3 or fewer", () => {
    const result = formatStepReceipt(["点击 5 次", "完成 3 轮呼吸"]);
    expect(result.visible).toEqual(["点击 5 次", "完成 3 轮呼吸"]);
    expect(result.overflow).toBe(0);
  });

  it("limits visible summaries to 3 and reports overflow count", () => {
    const result = formatStepReceipt(["第一步", "第二步", "第三步", "第四步", "第五步"]);
    expect(result.visible).toEqual(["第一步", "第二步", "第三步"]);
    expect(result.overflow).toBe(2);
  });

  it("handles an empty list", () => {
    const result = formatStepReceipt([]);
    expect(result.visible).toEqual([]);
    expect(result.overflow).toBe(0);
  });
});
