import { gapsOf } from "@/modules/transfers/domain/gaps";
import {
  durationMinutes,
  MAX_TRANSFERS_PER_TRIP,
  type Transfer,
} from "@/modules/transfers/domain/transfer";
import type {
  Clock,
  IdGenerator,
  NewTransfer,
  TransfersRepository,
  TripContextReader,
} from "@/modules/transfers/service/ports";
import {
  type TransferDto,
  type TransferError,
  type TransferInput,
  toTransferDto,
} from "@/modules/transfers/service/schemas";
import type { Result } from "@/shared/kernel/result";
import { err, ok } from "@/shared/kernel/result";

export type CreateTransferCommand = {
  userId: string;
  tripId: string;
  locale: "en" | "es";
  input: TransferInput;
};

function toRecord(
  id: string,
  { userId, tripId, input }: CreateTransferCommand,
  tripCurrency: string,
  createdAt: number,
): NewTransfer {
  const currency = input.cost === null ? null : (input.currency ?? tripCurrency);
  return {
    id,
    tripId,
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
    rate: currency === null ? null : currency === tripCurrency ? "1" : (input.rate ?? "1"),
    charge: input.charge,
    bookingRef: input.bookingRef,
    link: input.link,
    notes: input.notes,
    needsReview: false,
    version: 1,
    createdBy: userId,
    createdAt,
  };
}

/** Any member adds a transfer to a gap; the creator is not joined to it. */
export async function createTransfer(
  command: CreateTransferCommand,
  {
    transfers,
    trips,
    ids,
    clock,
  }: {
    transfers: Pick<TransfersRepository, "listForTrip" | "create">;
    trips: TripContextReader;
    ids: IdGenerator;
    clock: Clock;
  },
): Promise<Result<TransferDto, TransferError>> {
  const { userId, tripId, locale } = command;
  const context = await trips.get(tripId, userId, locale);
  if (context === null) {
    return err({ code: "TRIP_NOT_FOUND" });
  }
  const now = clock.now();
  const record = toRecord(ids.next(), command, context.currency, now);
  const minutes = durationMinutes({ ...record, participantIds: [] });
  if (minutes !== null && minutes < 0) {
    return err({ code: "TRANSFER_ARRIVAL_BEFORE" });
  }
  if ((await transfers.listForTrip(tripId)).length >= MAX_TRANSFERS_PER_TRIP) {
    return err({ code: "TOO_MANY_TRANSFERS" });
  }
  const created: Transfer = await transfers.create(record);
  return ok(
    toTransferDto(created, {
      gaps: gapsOf(context.route),
      members: new Set(context.memberIds),
      now,
    }),
  );
}
