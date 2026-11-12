import { describe, expect, it } from "vitest";
import { BUDGET_CATEGORIES, TRANSFER_MODES } from "@/modules/agent/domain/suggestion";

describe("suggestion vocabulary", () => {
  it("has no flights budget category: flights are transfers", () => {
    expect(BUDGET_CATEGORIES).not.toContain("flights");
    expect(BUDGET_CATEGORIES).toEqual(["lodging", "transport", "food", "other"]);
  });

  it("offers every transfer mode", () => {
    expect(TRANSFER_MODES).toEqual(["flight", "train", "bus", "ferry", "car", "other"]);
  });
});
