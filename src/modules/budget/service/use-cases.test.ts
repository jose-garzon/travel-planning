import { describe, expect, it } from "vitest";
import type { BudgetRepository, TripContextReader } from "@/modules/budget/service/ports";
import { budgetItemInputSchema } from "@/modules/budget/service/schemas";
import { getBudget } from "@/modules/budget/service/use-cases";

const budget: BudgetRepository = {
  listItems: async () => [],
  findItem: async () => null,
  createItem: async () => {},
  updateItem: async () => {},
  removeItem: async () => {},
  getCap: async () => null,
  setCap: async () => {},
};

const trips: TripContextReader = {
  get: async () => ({ currency: "COP", memberIds: ["u1", "u2", "u3"] }),
};

describe("getBudget", () => {
  it("adds transfers to the shares and lists them for the Transfers group", async () => {
    const transfer = {
      id: "t1",
      gap: 0,
      label: "Bogotá → Cartagena",
      cost: 10000,
      charge: "all" as const,
      participantIds: [],
    };

    const result = await getBudget(
      { userId: "u1", tripId: "trip" },
      {
        budget,
        trips,
        activityCosts: { forTrip: async () => [] },
        transferCosts: { forTrip: async () => [transfer] },
      },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.summary.byCategory.transfers).toBe(30000);
    expect(result.value.mine).toBe(10000);
    expect(result.value.transfers).toEqual([transfer]);
  });
});

describe("budgetItemInputSchema", () => {
  const input = {
    label: "AV 9512",
    amount: 1,
    currency: "COP",
    rate: null,
    userId: null,
    link: null,
  };

  it("rejects the removed flights category", () => {
    expect(budgetItemInputSchema.safeParse({ ...input, category: "flights" }).success).toBe(false);
    expect(budgetItemInputSchema.safeParse({ ...input, category: "lodging" }).success).toBe(true);
  });
});
