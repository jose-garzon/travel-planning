import { describe, expect, it } from "vitest";
import type { Transfer } from "@/modules/transfers/domain/transfer";
import type {
  TransfersRepository,
  TripContext,
  TripContextReader,
} from "@/modules/transfers/service/ports";
import type { TransferUpdate } from "@/modules/transfers/service/schemas";
import { updateTransfer } from "@/modules/transfers/service/update-transfer";

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

const existing: Transfer = {
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
  charge: "opt-in",
  bookingRef: null,
  link: null,
  notes: null,
  needsReview: true,
  version: 3,
  createdBy: "u2",
  createdAt: 500,
  participantIds: ["u1"],
};

function input(overrides: Partial<TransferUpdate> = {}): TransferUpdate {
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
    charge: "opt-in",
    bookingRef: null,
    link: null,
    notes: null,
    version: 3,
    ...overrides,
  };
}

function setup({
  stored = existing as Transfer | null,
  tripContext = context as TripContext | null,
  writeWins = true,
} = {}) {
  const writes: { transfer: Transfer; expectedVersion: number }[] = [];
  const transfers: Pick<TransfersRepository, "find" | "update"> = {
    find: async () => stored,
    update: async (transfer, expectedVersion) => {
      writes.push({ transfer, expectedVersion });
      return writeWins ? transfer : null;
    },
  };
  const trips: TripContextReader = { get: async () => tripContext };
  return { writes, deps: { transfers, trips, clock: { now: () => NOW } } };
}

const command = { userId: "u1", tripId: "trip-1", transferId: "t1", locale: "en" as const };

describe("updateTransfer", () => {
  it("answers TRIP_NOT_FOUND for a missing trip or a non-member", async () => {
    const { deps, writes } = setup({ tripContext: null });

    const result = await updateTransfer({ ...command, input: input() }, deps);

    expect(result).toEqual({ ok: false, error: { code: "TRIP_NOT_FOUND" } });
    expect(writes).toEqual([]);
  });

  it("answers TRANSFER_NOT_FOUND when the transfer is gone", async () => {
    const { deps, writes } = setup({ stored: null });

    const result = await updateTransfer({ ...command, input: input() }, deps);

    expect(result).toEqual({ ok: false, error: { code: "TRANSFER_NOT_FOUND" } });
    expect(writes).toEqual([]);
  });

  it("answers TRANSFER_VERSION_CONFLICT for a stale version without writing", async () => {
    const { deps, writes } = setup();

    const result = await updateTransfer({ ...command, input: input({ version: 2 }) }, deps);

    expect(result).toEqual({ ok: false, error: { code: "TRANSFER_VERSION_CONFLICT" } });
    expect(writes).toEqual([]);
  });

  it("answers TRANSFER_VERSION_CONFLICT when someone else wrote first", async () => {
    const { deps } = setup({ writeWins: false });

    const result = await updateTransfer({ ...command, input: input() }, deps);

    expect(result).toEqual({ ok: false, error: { code: "TRANSFER_VERSION_CONFLICT" } });
  });

  it("rejects an arrival before the departure", async () => {
    const { deps, writes } = setup();

    const result = await updateTransfer(
      {
        ...command,
        input: input({ departTime: "12:00", arriveDate: "2027-03-15", arriveTime: "09:00" }),
      },
      deps,
    );

    expect(result).toEqual({ ok: false, error: { code: "TRANSFER_ARRIVAL_BEFORE" } });
    expect(writes).toEqual([]);
  });

  it("writes against the version it read and bumps it", async () => {
    const { deps, writes } = setup();

    const result = await updateTransfer(
      { ...command, input: input({ bookingRef: "AV9512" }) },
      deps,
    );

    expect(writes).toHaveLength(1);
    expect(writes[0]?.expectedVersion).toBe(3);
    expect(writes[0]?.transfer).toMatchObject({
      id: "t1",
      bookingRef: "AV9512",
      version: 4,
      createdBy: "u2",
      createdAt: 500,
      participantIds: ["u1"],
      needsReview: false,
    });
    expect(result).toMatchObject({
      ok: true,
      value: { id: "t1", bookingRef: "AV9512", version: 4 },
    });
  });

  it("stores the cost in minor units with the rate to the trip currency", async () => {
    const { deps, writes } = setup();

    const result = await updateTransfer(
      { ...command, input: input({ cost: 100, currency: "USD", rate: "4000" }) },
      deps,
    );

    expect(writes[0]?.transfer).toMatchObject({ cost: 10000, currency: "USD", rate: "4000" });
    expect(result).toMatchObject({ ok: true, value: { costInTripCurrency: 40_000_000 } });
  });

  it("clears the currency and rate when the cost is removed", async () => {
    const { deps, writes } = setup({
      stored: { ...existing, cost: 5000, currency: "USD", rate: "4000" },
    });

    await updateTransfer({ ...command, input: input({ cost: null }) }, deps);

    expect(writes[0]?.transfer).toMatchObject({ cost: null, currency: null, rate: null });
  });
});
