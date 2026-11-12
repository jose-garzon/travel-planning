import { describe, expect, it } from "vitest";
import { MAX_TRANSFERS_PER_TRIP, type Transfer } from "@/modules/transfers/domain/transfer";
import { createTransfer } from "@/modules/transfers/service/create-transfer";
import type {
  TransfersRepository,
  TripContext,
  TripContextReader,
} from "@/modules/transfers/service/ports";
import type { TransferInput } from "@/modules/transfers/service/schemas";

const NOW = Date.parse("2027-01-01T10:00:00Z");

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
    ],
  },
};

function input(overrides: Partial<TransferInput> = {}): TransferInput {
  return {
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
    ...overrides,
  };
}

function setup({ existing = 0, tripContext = context as TripContext | null } = {}) {
  const created: Transfer[] = [];
  const transfers: Pick<TransfersRepository, "listForTrip" | "create"> = {
    listForTrip: async () =>
      Array.from({ length: existing }, (_, n) => ({ id: `old-${n}` }) as Transfer),
    create: async (transfer) => {
      const stored = { ...transfer, participantIds: [] };
      created.push(stored);
      return stored;
    },
  };
  const trips: TripContextReader = { get: async () => tripContext };
  return {
    created,
    deps: { transfers, trips, ids: { next: () => "new-id" }, clock: { now: () => NOW } },
  };
}

const command = { userId: "u1", tripId: "trip-1", locale: "en" as const };

describe("createTransfer", () => {
  it("answers TRIP_NOT_FOUND for a missing trip or a non-member", async () => {
    const { deps, created } = setup({ tripContext: null });

    const result = await createTransfer({ ...command, input: input() }, deps);

    expect(result).toEqual({ ok: false, error: { code: "TRIP_NOT_FOUND" } });
    expect(created).toEqual([]);
  });

  it("stores the transfer for the caller and returns its DTO", async () => {
    const { deps, created } = setup();

    const result = await createTransfer(
      { ...command, input: input({ departTime: "09:40", bookingRef: "AV9512" }) },
      deps,
    );

    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({
      id: "new-id",
      tripId: "trip-1",
      gap: 0,
      mode: "flight",
      from: "Bogotá",
      to: "Cartagena",
      departDate: "2027-03-15",
      departTime: "09:40",
      bookingRef: "AV9512",
      charge: "all",
      needsReview: false,
      version: 1,
      createdBy: "u1",
      createdAt: NOW,
    });
    expect(result).toMatchObject({
      ok: true,
      value: { id: "new-id", gap: 0, from: "Bogotá", to: "Cartagena", version: 1 },
    });
  });

  it("converts the cost to minor units and uses the trip currency by default", async () => {
    const { deps, created } = setup();

    await createTransfer({ ...command, input: input({ cost: 180.5 }) }, deps);

    expect(created[0]).toMatchObject({ cost: 18050, currency: "COP", rate: "1" });
  });

  it("keeps the rate of a foreign currency", async () => {
    const { deps, created } = setup();

    await createTransfer(
      { ...command, input: input({ cost: 180, currency: "USD", rate: "4000" }) },
      deps,
    );

    expect(created[0]).toMatchObject({ cost: 18000, currency: "USD", rate: "4000" });
  });

  it("stores no currency or rate without a cost", async () => {
    const { deps, created } = setup();

    await createTransfer({ ...command, input: input({ currency: "USD", rate: "4000" }) }, deps);

    expect(created[0]).toMatchObject({ cost: null, currency: null, rate: null });
  });

  it("refuses an arrival before the departure", async () => {
    const { deps, created } = setup();

    const result = await createTransfer(
      { ...command, input: input({ departTime: "11:05", arriveTime: "09:40" }) },
      deps,
    );

    expect(result).toEqual({ ok: false, error: { code: "TRANSFER_ARRIVAL_BEFORE" } });
    expect(created).toEqual([]);
  });

  it("accepts a next-day arrival", async () => {
    const { deps } = setup();

    const result = await createTransfer(
      {
        ...command,
        input: input({ departTime: "22:00", arriveDate: "2027-03-16", arriveTime: "01:00" }),
      },
      deps,
    );

    expect(result).toMatchObject({ ok: true, value: { durationMinutes: 180, dayOffset: 1 } });
  });

  it("refuses the 51st transfer of a trip", async () => {
    const { deps, created } = setup({ existing: MAX_TRANSFERS_PER_TRIP });

    const result = await createTransfer({ ...command, input: input() }, deps);

    expect(result).toEqual({ ok: false, error: { code: "TOO_MANY_TRANSFERS" } });
    expect(created).toEqual([]);
  });

  it("accepts the 50th transfer", async () => {
    const { deps } = setup({ existing: MAX_TRANSFERS_PER_TRIP - 1 });

    const result = await createTransfer({ ...command, input: input() }, deps);

    expect(result.ok).toBe(true);
  });

  it.each([null, "0", "0.0"])("refuses a foreign-currency cost with rate %s", async (rate) => {
    const { deps, created } = setup();

    const result = await createTransfer(
      { ...command, input: input({ cost: 180, currency: "USD", rate }) },
      deps,
    );

    expect(result).toEqual({ ok: false, error: { code: "VALIDATION_FAILED" } });
    expect(created).toEqual([]);
  });

  it("fills a missing zone from the gap's city when the name matches", async () => {
    const { deps, created } = setup();

    await createTransfer(
      { ...command, input: input({ from: "bogota", to: "Cartagena", departTime: "09:00" }) },
      deps,
    );

    expect(created[0]).toMatchObject({
      departTz: "America/Bogota",
      arriveTz: "America/Bogota",
    });
  });

  it("keeps a zone the traveler gave and leaves unknown cities without one", async () => {
    const { deps, created } = setup();

    await createTransfer(
      {
        ...command,
        input: input({ from: "Medellín", to: "Cartagena", departTz: "America/Lima" }),
      },
      deps,
    );

    expect(created[0]).toMatchObject({ departTz: "America/Lima" });
    const { deps: other, created: others } = setup();
    await createTransfer({ ...command, input: input({ from: "Medellín" }) }, other);
    expect(others[0]?.departTz).toBeNull();
  });
});
