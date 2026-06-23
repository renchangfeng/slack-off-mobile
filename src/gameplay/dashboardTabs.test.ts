import { describe, expect, it } from "vitest";
import { dashboardTabs, getDashboardTab } from "./dashboardTabs";

describe("dashboard tabs", () => {
  it("defines the five product sections in stable order", () => {
    expect(dashboardTabs.map((tab) => tab.value)).toEqual([
      "home",
      "activities",
      "beans",
      "rankings",
      "profile"
    ]);
  });

  it("falls back to home for an unknown runtime value", () => {
    expect(getDashboardTab("missing" as never).value).toBe("home");
  });
});
