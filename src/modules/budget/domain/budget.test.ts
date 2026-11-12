import { describe, expect, it } from "vitest";
import { type BudgetItem, splitEqually, summarize } from "@/modules/budget/domain/budget";

function item(overrides: Partial<BudgetItem>): BudgetItem {
  return {
    id: "i",
    tripId: "t",
    category: "lodging",
    label: "Hotel",
    amount: 0,
    currency: "EUR",
    rate: "1",
    userId: null,
    link: null,
    stop: null,
    ...overrides,
  };
}

describe("splitEqually", () => {
  it("gives the remainder to the first people so shares add up", () => {
    expect(splitEqually(1000, 3)).toEqual([334, 333, 333]);
    expect(splitEqually(500, 0)).toEqual([]);
  });
});

describe("summarize", () => {
  const memberIds = ["ana", "ben", "cai"];

  it("charges shared unit prices to every member, per-person items and activities", () => {
    const summary = summarize({
      memberIds,
      cap: null,
      items: [
        item({ amount: 30000 }),
        item({ category: "flights", amount: 50000, userId: "ana" }),
        item({ category: "food", amount: 100, currency: "USD", rate: "0.9" }),
      ],
      activities: [{ title: "Tour", cost: 2000, participantIds: ["ana", "ben"] }],
    });
    const byId = Object.fromEntries(summary.perPerson.map((p) => [p.userId, p.total]));
    expect(byId).toEqual({
      ana: 30000 + 50000 + 90 + 2000,
      ben: 30000 + 90 + 2000,
      cai: 30000 + 90,
    });
    expect(summary.byCategory.activities).toBe(4000);
    expect(summary.total).toBe(3 * 30000 + 50000 + 3 * 90 + 4000);
    expect(summary.remaining).toBeNull();
  });

  it("grows the total of a unit price when a member joins", () => {
    const items = [item({ amount: 2500 })];
    const two = summarize({ memberIds: ["ana", "ben"], cap: null, items, activities: [] });
    const three = summarize({ memberIds, cap: null, items, activities: [] });
    expect(two.total).toBe(5000);
    expect(three.total).toBe(7500);
    expect(three.perPerson.map((p) => p.total)).toEqual([2500, 2500, 2500]);
  });

  it("ignores per-person items and participants of people who left", () => {
    const summary = summarize({
      memberIds,
      cap: null,
      items: [item({ category: "flights", amount: 9999, userId: "gone" })],
      activities: [{ title: "Tour", cost: 500, participantIds: ["gone"] }],
    });
    expect(summary.total).toBe(0);
  });

  it("reports remaining and over the cap", () => {
    const under = summarize({
      memberIds,
      cap: 1000,
      items: [item({ amount: 200 })],
      activities: [],
    });
    expect(under.remaining).toBe(400);
    const over = summarize({ memberIds, cap: 100, items: [item({ amount: 200 })], activities: [] });
    expect(over.remaining).toBe(-500);
  });
});
