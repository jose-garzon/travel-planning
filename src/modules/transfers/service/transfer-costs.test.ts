import { describe, expect, it } from "vitest";
import type { Transfer } from "@/modules/transfers/domain/transfer";
import { transferCosts } from "@/modules/transfers/service/transfer-costs";

function transfer(overrides: Partial<Transfer>): Transfer {
  return {
    id: "t1",
    tripId: "trip",
    gap: 0,
    mode: "flight",
    from: "Bogotá",
    to: "Cartagena",
    departDate: "2027-03-15",
    departTime: null,
    departTz: null,
    arriveDate: null,
    arriveTime: null,
    arriveTz: null,
    cost: 10000,
    currency: "COP",
    rate: "1",
    charge: "all",
    bookingRef: null,
    link: null,
    notes: null,
    needsReview: false,
    version: 1,
    createdBy: "u1",
    createdAt: 0,
    participantIds: [],
    ...overrides,
  };
}

describe("transferCosts", () => {
  it("lists priced transfers with a label and the cost in trip currency, in one read", async () => {
    let reads = 0;
    const costs = await transferCosts(
      { tripId: "trip" },
      {
        transfers: {
          listForTrip: async () => {
            reads += 1;
            return [
              transfer({
                cost: 18000,
                currency: "USD",
                rate: "4000",
                charge: "opt-in",
                participantIds: ["u2"],
              }),
              transfer({ id: "t2", cost: null }),
            ];
          },
        },
      },
    );

    expect(reads).toBe(1);
    expect(costs).toEqual([
      {
        id: "t1",
        gap: 0,
        label: "Bogotá → Cartagena",
        cost: 72_000_000,
        charge: "opt-in",
        participantIds: ["u2"],
      },
    ]);
  });
});
