import { gapsOf } from "@/modules/transfers/domain/gaps";
import { arrivesBeforeDeparture, type Transfer } from "@/modules/transfers/domain/transfer";
import type {
  Clock,
  TransfersRepository,
  TripContextReader,
} from "@/modules/transfers/service/ports";
import {
  type TransferDto,
  type TransferError,
  type TransferUpdate,
  toTransferDto,
} from "@/modules/transfers/service/schemas";
import type { Result } from "@/shared/kernel/result";
import { err, ok } from "@/shared/kernel/result";

export type UpdateTransferCommand = {
  userId: string;
  tripId: string;
  transferId: string;
  locale: "en" | "es";
  input: TransferUpdate;
};

/** Any member edits a transfer; the write fails when it changed since the editor read it. */
export async function updateTransfer(
  { userId, tripId, transferId, locale, input }: UpdateTransferCommand,
  {
    transfers,
    trips,
    clock,
  }: {
    transfers: Pick<TransfersRepository, "find" | "update">;
    trips: TripContextReader;
    clock: Clock;
  },
): Promise<Result<TransferDto, TransferError>> {
  const context = await trips.get(tripId, userId, locale);
  if (context === null) {
    return err({ code: "TRIP_NOT_FOUND" });
  }
  const stored = await transfers.find(tripId, transferId);
  if (stored === null) {
    return err({ code: "TRANSFER_NOT_FOUND" });
  }
  if (stored.version !== input.version) {
    return err({ code: "TRANSFER_VERSION_CONFLICT" });
  }
  const currency = input.cost === null ? null : (input.currency ?? context.currency);
  const next: Transfer = {
    ...stored,
    gap: input.gap,
    mode: input.mode,
    from: input.from,
    to: input.to,
    departDate: input.departDate,
    departTime: input.departTime,
    departTz: input.departTz,
    arriveDate: input.arriveDate,
    arriveTime: input.arriveTime,
    arriveTz: input.arriveTz,
    cost: input.cost === null ? null : Math.round(input.cost * 100),
    currency,
    rate: currency === null ? null : currency === context.currency ? "1" : (input.rate ?? "1"),
    charge: input.charge,
    bookingRef: input.bookingRef,
    link: input.link,
    notes: input.notes,
    // Saving is the traveler's confirmation of the details.
    needsReview: false,
    version: stored.version + 1,
  };
  if (arrivesBeforeDeparture(next)) {
    return err({ code: "TRANSFER_ARRIVAL_BEFORE" });
  }
  const saved = await transfers.update(next, stored.version);
  if (saved === null) {
    return err({ code: "TRANSFER_VERSION_CONFLICT" });
  }
  return ok(
    toTransferDto(saved, {
      gaps: gapsOf(context.route),
      members: new Set(context.memberIds),
      now: clock.now(),
    }),
  );
}
