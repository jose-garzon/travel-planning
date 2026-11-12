import { gapsOf } from "@/modules/transfers/domain/gaps";
import { sortTransfers } from "@/modules/transfers/domain/transfer";
import type {
  Clock,
  TransfersRepository,
  TripContextReader,
} from "@/modules/transfers/service/ports";
import {
  type TransferError,
  type TransfersDto,
  toTransferDto,
} from "@/modules/transfers/service/schemas";
import type { Result } from "@/shared/kernel/result";
import { err, ok } from "@/shared/kernel/result";

export type ListTransfersQuery = { userId: string; tripId: string; locale: "en" | "es" };

/** Every transfer of a trip with the route's gaps, in order (members only). */
export async function listTransfers(
  { userId, tripId, locale }: ListTransfersQuery,
  {
    transfers,
    trips,
    clock,
  }: {
    transfers: Pick<TransfersRepository, "listForTrip">;
    trips: TripContextReader;
    clock: Clock;
  },
): Promise<Result<TransfersDto, TransferError>> {
  const context = await trips.get(tripId, userId, locale);
  if (context === null) {
    return err({ code: "TRIP_NOT_FOUND" });
  }
  const gaps = gapsOf(context.route);
  const members = new Set(context.memberIds);
  const now = clock.now();
  return ok({
    currency: context.currency,
    gaps,
    transfers: sortTransfers(await transfers.listForTrip(tripId)).map((transfer) =>
      toTransferDto(transfer, { gaps, members, now }),
    ),
  });
}
