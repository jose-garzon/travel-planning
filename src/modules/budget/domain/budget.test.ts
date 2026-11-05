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

  it("splits shared items, charges per-person items and subscribed activities", () => {
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
      ana: 10000 + 50000 + 30 + 2000,
      ben: 10000 + 30 + 2000,
      cai: 10000 + 30,
    });
    expect(summary.byCategory.activities).toBe(4000);
    expect(summary.total).toBe(30000 + 50000 + 90 + 4000);
    expect(summary.remaining).toBeNull();
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
      items: [item({ amount: 600 })],
      activities: [],
    });
    expect(under.remaining).toBe(400);
    const over = summarize({ memberIds, cap: 100, items: [item({ amount: 600 })], activities: [] });
    expect(over.remaining).toBe(-500);
  });
});
