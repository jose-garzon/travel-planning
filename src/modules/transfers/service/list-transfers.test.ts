import { describe, expect, it } from "vitest";
import type { Transfer } from "@/modules/transfers/domain/transfer";
import { listTransfers } from "@/modules/transfers/service/list-transfers";
import type {
  TransfersRepository,
  TripContext,
  TripContextReader,
} from "@/modules/transfers/service/ports";

const NOW = Date.parse("2027-03-15T20:00:00Z");

const context: TripContext = {
  currency: "COP",
  memberIds: ["u1", "u2"],
  route: {
    legs: [
      {
        from: { name: "Bogotá", code: "BOG", tz: "America/Bogota" },
        to: { name: "Cartagena", code: "CTG", tz: "America/Bogota" },
        date: "2027-03-15",
      },
      {
        from: { name: "Cartagena", code: "CTG", tz: "America/Bogota" },
        to: { name: "Santa Marta", code: "SMR", tz: "America/Bogota" },
        date: "2027-03-19",
      },
    ],
  },
};

function transfer(overrides: Partial<Transfer> = {}): Transfer {
  return {
    id: "t1",
    tripId: "trip-1",
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
    cost: null,
    currency: null,
    rate: null,
    charge: "all",
    bookingRef: null,
    link: null,
    notes: null,
    needsReview: false,
    version: 1,
    createdBy: "u1",
    createdAt: 1000,
    participantIds: [],
    ...overrides,
  };
}

function deps(stored: Transfer[], tripContext: TripContext | null = context) {
  const transfers: Pick<TransfersRepository, "listForTrip"> = {
    listForTrip: async () => stored,
  };
  const trips: TripContextReader = { get: async () => tripContext };
  return { transfers, trips, clock: { now: () => NOW } };
}

const query = { userId: "u1", tripId: "trip-1", locale: "en" as const };

async function list(stored: Transfer[], tripContext: TripContext | null = context) {
  const result = await listTransfers(query, deps(stored, tripContext));
  if (!result.ok) {
    throw new Error(`expected ok, got ${result.error.code}`);
  }
  return result.value;
}

describe("listTransfers", () => {
  it("answers TRIP_NOT_FOUND for a missing trip or a non-member", async () => {
    const result = await listTransfers(query, deps([], null));

    expect(result).toEqual({ ok: false, error: { code: "TRIP_NOT_FOUND" } });
  });

  it("returns the trip currency, the gaps and no transfers for an empty trip", async () => {
    const value = await list([]);

    expect(value.currency).toBe("COP");
    expect(value.gaps.map((gap) => gap.kind)).toEqual(["outbound", "between", "return"]);
    expect(value.transfers).toEqual([]);
  });

  it("sorts by gap, then departure, then creation", async () => {
    const value = await list([
      transfer({ id: "late", gap: 1, departDate: "2027-03-19", departTime: "14:00" }),
      transfer({ id: "early", gap: 1, departDate: "2027-03-19", departTime: "08:00" }),
      transfer({ id: "first", gap: 0 }),
    ]);

    expect(value.transfers.map((t) => t.id)).toEqual(["first", "early", "late"]);
  });

  it("computes duration, day offset and cost in the trip currency", async () => {
    const value = await list([
      transfer({
        departTime: "22:00",
        departTz: "America/Bogota",
        arriveDate: "2027-03-16",
        arriveTime: "01:30",
        arriveTz: "America/Bogota",
        cost: 18000,
        currency: "USD",
        rate: "4000",
      }),
    ]);

    expect(value.transfers[0]).toMatchObject({
      id: "t1",
      mode: "flight",
      from: "Bogotá",
      to: "Cartagena",
      durationMinutes: 210,
      dayOffset: 1,
      cost: 18000,
      currency: "USD",
      costInTripCurrency: 72_000_000,
      charge: "all",
    });
  });

  it("leaves duration and cost unknown when the data is missing", async () => {
    const value = await list([transfer()]);

    expect(value.transfers[0]).toMatchObject({
      durationMinutes: null,
      dayOffset: 0,
      cost: null,
      costInTripCurrency: null,
    });
  });

  it("flags a transfer that no longer matches its gap, is outside its dates, or is past", async () => {
    const value = await list([
      transfer({ id: "ok", gap: 0, departTime: "20:00", departTz: "America/Bogota" }),
      transfer({
        id: "moved",
        gap: 1,
        from: "Medellín",
        to: "Santa Marta",
        departDate: "2027-03-17",
      }),
      transfer({
        id: "off-dates",
        gap: 1,
        from: "Cartagena",
        to: "Santa Marta",
        departDate: "2027-04-01",
      }),
      transfer({ id: "orphan", gap: 7 }),
    ]);

    const byId = Object.fromEntries(value.transfers.map((t) => [t.id, t]));
    expect(byId.ok).toMatchObject({ routeChanged: false, outsideWindow: false, isPast: false });
    expect(byId.moved).toMatchObject({ routeChanged: true, outsideWindow: false });
    expect(byId["off-dates"]).toMatchObject({ routeChanged: false, outsideWindow: true });
    expect(byId.orphan).toMatchObject({ routeChanged: true });
  });

  it("marks a departed transfer as past", async () => {
    const value = await list([
      transfer({
        id: "gone",
        departDate: "2027-03-15",
        departTime: "09:40",
        departTz: "America/Bogota",
      }),
    ]);

    expect(value.transfers[0]?.isPast).toBe(true);
  });

  it("drops participants who left the trip", async () => {
    const value = await list([transfer({ charge: "opt-in", participantIds: ["u1", "gone"] })]);

    expect(value.transfers[0]?.participantIds).toEqual(["u1"]);
  });
});
