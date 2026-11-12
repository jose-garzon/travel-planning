import { z } from "zod";
import type { Gap } from "@/modules/transfers/domain/gaps";
import {
  type ChargeMode,
  costInTripCurrency,
  dayOffset,
  durationMinutes,
  isPast,
  outsideWindow,
  routeChanged,
  TRANSFER_MODES,
  type Transfer,
  type TransferMode,
} from "@/modules/transfers/domain/transfer";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const zone = z.string().regex(/^[A-Za-z_]+(\/[A-Za-z0-9_+-]+)+$|^UTC$/);
const optional = <T extends z.ZodType>(schema: T) => schema.nullable().default(null);

export const transferInputSchema = z.object({
  gap: z.number().int().min(0).max(100),
  mode: z.enum(TRANSFER_MODES),
  from: z.string().trim().min(1).max(120),
  to: z.string().trim().min(1).max(120),
  departDate: date,
  departTime: optional(time),
  departTz: optional(zone),
  arriveDate: optional(date),
  arriveTime: optional(time),
  arriveTz: optional(zone),
  /** Major units as entered (180.50); stored as minor units. */
  cost: optional(z.number().min(0).max(1_000_000_000)),
  currency: optional(z.string().regex(/^[A-Z]{3}$/)),
  rate: optional(z.string().regex(/^\d+(\.\d+)?$/)),
  charge: z.enum(["all", "opt-in"]),
  bookingRef: optional(z.string().trim().max(60)),
  link: optional(z.url().max(500)),
  notes: optional(z.string().trim().max(500)),
});

export type TransferInput = z.infer<typeof transferInputSchema>;

export type TransferDto = {
  id: string;
  gap: number;
  mode: TransferMode;
  from: string;
  to: string;
  departDate: string;
  departTime: string | null;
  departTz: string | null;
  arriveDate: string | null;
  arriveTime: string | null;
  arriveTz: string | null;
  durationMinutes: number | null;
  /** Days between departure and arrival dates: 0, 1, 2… */
  dayOffset: number;
  /** Minor units in `currency`. */
  cost: number | null;
  currency: string | null;
  /** Per traveler, trip-currency minor units. */
  costInTripCurrency: number | null;
  charge: ChargeMode;
  participantIds: string[];
  bookingRef: string | null;
  link: string | null;
  notes: string | null;
  needsReview: boolean;
  routeChanged: boolean;
  isPast: boolean;
  outsideWindow: boolean;
  version: number;
};

export type TransfersDto = {
  currency: string;
  gaps: Gap[];
  transfers: TransferDto[];
};

/** Every failure the transfers use cases answer (plan "Contracts" errors). */
export type TransferError =
  | { code: "TRIP_NOT_FOUND" }
  | { code: "TRANSFER_NOT_FOUND" }
  | { code: "TRANSFER_ARRIVAL_BEFORE" }
  | { code: "TRANSFER_NOT_OPT_IN" }
  | { code: "TRANSFER_VERSION_CONFLICT" }
  | { code: "TOO_MANY_TRANSFERS" };

/** A transfer as the API shows it; `members` filters out participants who left. */
export function toTransferDto(
  transfer: Transfer,
  { gaps, members, now }: { gaps: Gap[]; members: ReadonlySet<string>; now: number },
): TransferDto {
  const gap = gaps[transfer.gap];
  return {
    id: transfer.id,
    gap: transfer.gap,
    mode: transfer.mode,
    from: transfer.from,
    to: transfer.to,
    departDate: transfer.departDate,
    departTime: transfer.departTime,
    departTz: transfer.departTz,
    arriveDate: transfer.arriveDate,
    arriveTime: transfer.arriveTime,
    arriveTz: transfer.arriveTz,
    durationMinutes: durationMinutes(transfer),
    dayOffset: dayOffset(transfer),
    cost: transfer.cost,
    currency: transfer.currency,
    costInTripCurrency: costInTripCurrency(transfer),
    charge: transfer.charge,
    participantIds: transfer.participantIds.filter((id) => members.has(id)),
    bookingRef: transfer.bookingRef,
    link: transfer.link,
    notes: transfer.notes,
    needsReview: transfer.needsReview,
    routeChanged: routeChanged(transfer, gap),
    isPast: isPast(transfer, now),
    outsideWindow: outsideWindow(transfer, gap),
    version: transfer.version,
  };
}
