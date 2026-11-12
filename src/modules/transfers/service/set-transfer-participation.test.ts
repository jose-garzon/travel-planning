import { describe, expect, it } from "vitest";
import type { Transfer } from "@/modules/transfers/domain/transfer";
import type {
  TransfersRepository,
  TripContext,
  TripContextReader,
} from "@/modules/transfers/service/ports";
import { setTransferParticipation } from "@/modules/transfers/service/set-transfer-participation";

const context: TripContext = { currency: "COP", memberIds: ["u1"], route: { legs: [] } };

function stored(charge: Transfer["charge"]): Transfer {
  return {
    id: "t1",
    tripId: "trip-1",
    gap: 0,
    mode: "bus",
    from: "Cartagena",
    to: "Santa Marta",
    departDate: "2027-03-19",
    departTime: null,
    departTz: null,
    arriveDate: null,
    arriveTime: null,
    arriveTz: null,
    cost: 2500,
    currency: "COP",
    rate: "1",
    charge,
    bookingRef: null,
    link: null,
    notes: null,
    needsReview: false,
    version: 1,
    createdBy: "u1",
    createdAt: 0,
    participantIds: [],
  };
}

function setup({
  tripContext = context as TripContext | null,
  found = stored("opt-in") as Transfer | null,
} = {}) {
  const calls: string[] = [];
  const transfers: Pick<TransfersRepository, "find" | "addParticipant" | "removeParticipant"> = {
    find: async () => found,
    addParticipant: async (transferId, userId) => {
      calls.push(`add ${transferId} ${userId}`);
    },
    removeParticipant: async (transferId, userId) => {
      calls.push(`remove ${transferId} ${userId}`);
    },
  };
  const trips: TripContextReader = { get: async () => tripContext };
  return { calls, deps: { transfers, trips } };
}

const command = {
  userId: "u1",
  tripId: "trip-1",
  transferId: "t1",
  locale: "en" as const,
  joined: true,
};

describe("setTransferParticipation", () => {
  it("answers TRIP_NOT_FOUND for a missing trip or a non-member", async () => {
    const { deps, calls } = setup({ tripContext: null });

    expect(await setTransferParticipation(command, deps)).toEqual({
      ok: false,
      error: { code: "TRIP_NOT_FOUND" },
    });
    expect(calls).toEqual([]);
  });

  it("answers TRANSFER_NOT_FOUND for an unknown transfer", async () => {
    const { deps } = setup({ found: null });

    expect(await setTransferParticipation(command, deps)).toEqual({
      ok: false,
      error: { code: "TRANSFER_NOT_FOUND" },
    });
  });

  it("answers TRANSFER_NOT_OPT_IN when everyone pays", async () => {
    const { deps, calls } = setup({ found: stored("all") });

    expect(await setTransferParticipation(command, deps)).toEqual({
      ok: false,
      error: { code: "TRANSFER_NOT_OPT_IN" },
    });
    expect(calls).toEqual([]);
  });

  it("adds the caller on join", async () => {
    const { deps, calls } = setup();

    expect(await setTransferParticipation(command, deps)).toEqual({ ok: true, value: null });
    expect(calls).toEqual(["add t1 u1"]);
  });

  it("removes the caller on leave", async () => {
    const { deps, calls } = setup();

    expect(await setTransferParticipation({ ...command, joined: false }, deps)).toEqual({
      ok: true,
      value: null,
    });
    expect(calls).toEqual(["remove t1 u1"]);
  });
});
