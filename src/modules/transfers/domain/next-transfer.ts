import { isPast, type Transfer } from "@/modules/transfers/domain/transfer";

const DAY_MS = 24 * 60 * 60 * 1000;

/** What "next" needs to know about a transfer: when it leaves. */
export type Departing = Pick<Transfer, "departDate" | "departTime" | "departTz">;

/** Epoch ms of the departure; a date-only transfer counts from the start of its (UTC) day. */
function departure(transfer: Departing): number {
  const wall = Date.parse(`${transfer.departDate}T${transfer.departTime ?? "00:00"}:00Z`);
  if (transfer.departTime === null || transfer.departTz === null) {
    return wall;
  }
  // The zone's offset at that wall time: format the wall instant there and diff.
  const shown = new Date(
    new Date(wall).toLocaleString("en-US", { timeZone: transfer.departTz }),
  ).getTime();
  const local = new Date(new Date(wall).toLocaleString("en-US", { timeZone: "UTC" })).getTime();
  return wall - (shown - local);
}

/**
 * The upcoming transfer that leaves first. Past ones are skipped; a
 * date-only transfer stays upcoming through its day. Ties keep input order.
 */
export function nextTransfer<T extends Departing>(transfers: T[], now: number): T | null {
  let best: T | null = null;
  let bestAt = Number.POSITIVE_INFINITY;
  for (const transfer of transfers) {
    if (isPast(transfer, now)) {
      continue;
    }
    const at = departure(transfer);
    if (at < bestAt) {
      best = transfer;
      bestAt = at;
    }
  }
  return best;
}

/** Whole (UTC) days from today to `date`; 0 on the day itself or after it. */
export function daysUntil(date: string, now: number): number {
  const today = Date.parse(`${new Date(now).toISOString().slice(0, 10)}T00:00:00Z`);
  return Math.max(0, Math.round((Date.parse(`${date}T00:00:00Z`) - today) / DAY_MS));
}
