import type { TransfersRepository, TripContextReader } from "@/modules/transfers/service/ports";
import type { TransferError } from "@/modules/transfers/service/schemas";
import type { Result } from "@/shared/kernel/result";
import { err, ok } from "@/shared/kernel/result";

export type SetTransferParticipationCommand = {
  userId: string;
  tripId: string;
  transferId: string;
  locale: "en" | "es";
  joined: boolean;
};

/** A member joins or leaves an opt-in transfer; "all" transfers have nothing to join. */
export async function setTransferParticipation(
  { userId, tripId, transferId, locale, joined }: SetTransferParticipationCommand,
  {
    transfers,
    trips,
  }: {
    transfers: Pick<TransfersRepository, "find" | "addParticipant" | "removeParticipant">;
    trips: TripContextReader;
  },
): Promise<Result<null, TransferError>> {
  if ((await trips.get(tripId, userId, locale)) === null) {
    return err({ code: "TRIP_NOT_FOUND" });
  }
  const found = await transfers.find(tripId, transferId);
  if (found === null) {
    return err({ code: "TRANSFER_NOT_FOUND" });
  }
  if (found.charge !== "opt-in") {
    return err({ code: "TRANSFER_NOT_OPT_IN" });
  }
  await (joined
    ? transfers.addParticipant(transferId, userId)
    : transfers.removeParticipant(transferId, userId));
  return ok(null);
}
