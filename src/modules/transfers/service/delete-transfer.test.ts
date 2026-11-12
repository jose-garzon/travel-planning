import { describe, expect, it } from "vitest";
import { deleteTransfer } from "@/modules/transfers/service/delete-transfer";
import type {
  TransfersRepository,
  TripContext,
  TripContextReader,
} from "@/modules/transfers/service/ports";

const context: TripContext = { currency: "COP", memberIds: ["u1"], route: { legs: [] } };

function setup({ tripContext = context as TripContext | null, removes = true } = {}) {
  const removed: { tripId: string; transferId: string }[] = [];
  const transfers: Pick<TransfersRepository, "delete"> = {
    delete: async (tripId, transferId) => {
      removed.push({ tripId, transferId });
      return removes;
    },
  };
  const trips: TripContextReader = { get: async () => tripContext };
  return { removed, deps: { transfers, trips } };
}

const command = { userId: "u1", tripId: "trip-1", transferId: "t1", locale: "en" as const };

describe("deleteTransfer", () => {
  it("answers TRIP_NOT_FOUND for a missing trip or a non-member", async () => {
    const { deps, removed } = setup({ tripContext: null });

    expect(await deleteTransfer(command, deps)).toEqual({
      ok: false,
      error: { code: "TRIP_NOT_FOUND" },
    });
    expect(removed).toEqual([]);
  });

  it("answers TRANSFER_NOT_FOUND when nothing was removed", async () => {
    const { deps } = setup({ removes: false });

    expect(await deleteTransfer(command, deps)).toEqual({
      ok: false,
      error: { code: "TRANSFER_NOT_FOUND" },
    });
  });

  it("lets any member remove a transfer of the trip", async () => {
    const { deps, removed } = setup();

    expect(await deleteTransfer(command, deps)).toEqual({ ok: true, value: null });
    expect(removed).toEqual([{ tripId: "trip-1", transferId: "t1" }]);
  });
});
