import type { TransfersRepository, TripContextReader } from "@/modules/transfers/service/ports";
import type { TransferError } from "@/modules/transfers/service/schemas";
import type { Result } from "@/shared/kernel/result";
import { err, ok } from "@/shared/kernel/result";

export type DeleteTransferCommand = {
  userId: string;
  tripId: string;
  transferId: string;
  locale: "en" | "es";
};

/** Any member removes a transfer of the trip. */
export async function deleteTransfer(
  { userId, tripId, transferId, locale }: DeleteTransferCommand,
  {
    transfers,
    trips,
  }: { transfers: Pick<TransfersRepository, "delete">; trips: TripContextReader },
): Promise<Result<null, TransferError>> {
  if ((await trips.get(tripId, userId, locale)) === null) {
    return err({ code: "TRIP_NOT_FOUND" });
  }
  return (await transfers.delete(tripId, transferId))
    ? ok(null)
    : err({ code: "TRANSFER_NOT_FOUND" });
}
