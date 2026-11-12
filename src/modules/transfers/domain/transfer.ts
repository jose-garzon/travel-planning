// Transfer rules (feature 015 plan "Domain"). Pure: no I/O, no clock.
import type { Gap } from "@/modules/transfers/domain/gaps";

export const TRANSFER_MODES = ["flight", "train", "bus", "ferry", "car", "other"] as const;
export type TransferMode = (typeof TRANSFER_MODES)[number];
export type ChargeMode = "all" | "opt-in";

export type Transfer = {
  id: string;
  tripId: string;
  /** Index of the route gap. */
  gap: number;
  mode: TransferMode;
  /** Names as entered; compared with the gap's cities to flag a changed route. */
  from: string;
  to: string;
  /** `YYYY-MM-DD` and `HH:MM`, local to the matching IANA zone. */
  departDate: string;
  departTime: string | null;
  departTz: string | null;
  arriveDate: string | null;
  arriveTime: string | null;
  arriveTz: string | null;
  /** Minor units in `currency`, per traveler. */
  cost: number | null;
  currency: string | null;
  /** Trip-currency units per one unit of `currency`, as a decimal string. */
  rate: string | null;
  charge: ChargeMode;
  bookingRef: string | null;
  link: string | null;
  notes: string | null;
  needsReview: boolean;
  version: number;
  createdBy: string;
  /** Epoch ms. */
  createdAt: number;
  participantIds: string[];
};

export const MAX_TRANSFERS_PER_TRIP = 50;

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;

const formats = new Map<string, Intl.DateTimeFormat>();

/** Milliseconds `zone` is ahead of UTC at `instant`. Throws RangeError for an unknown zone. */
function offsetMs(instant: number, zone: string): number {
  let format = formats.get(zone);
  if (format === undefined) {
    format = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    });
    formats.set(zone, format);
  }
  const part = Object.fromEntries(
    format.formatToParts(new Date(instant)).map((p) => [p.type, Number(p.value)]),
  );
  const wall = Date.UTC(
    part.year ?? 0,
    (part.month ?? 1) - 1,
    part.day ?? 1,
    part.hour ?? 0,
    part.minute ?? 0,
    part.second ?? 0,
  );
  return wall - Math.floor(instant / 1000) * 1000;
}

/** The instant (epoch ms) of a local date and time in `zone`; null for an unknown zone. */
function instantOf(date: string, time: string, zone: string): number | null {
  const wall = Date.parse(`${date}T${time}:00Z`);
  try {
    // Second pass settles times near a daylight-saving change.
    const first = wall - offsetMs(wall, zone);
    return wall - offsetMs(first, zone);
  } catch {
    return null;
  }
}

/** Minutes from departure to arrival across zones; null when a time or a zone is missing. */
export function durationMinutes(transfer: Transfer): number | null {
  const { departTime, arriveTime, departTz, arriveTz } = transfer;
  if (departTime === null || arriveTime === null) {
    return null;
  }
  // No zone at either end: both are the same place, compare wall clocks.
  if ((departTz === null) !== (arriveTz === null)) {
    return null;
  }
  const depart = instantOf(transfer.departDate, departTime, departTz ?? "UTC");
  const arrive = instantOf(
    transfer.arriveDate ?? transfer.departDate,
    arriveTime,
    arriveTz ?? "UTC",
  );
  return depart === null || arrive === null ? null : Math.round((arrive - depart) / MINUTE_MS);
}

/** Calendar days between the departure date and the arrival date ("+1"). */
export function dayOffset(transfer: Transfer): number {
  if (transfer.arriveDate === null) {
    return 0;
  }
  const days = (Date.parse(transfer.arriveDate) - Date.parse(transfer.departDate)) / DAY_MS;
  return Math.max(0, Math.round(days));
}

/** By gap, then departure date and time (untimed first), then creation. */
export function sortTransfers(transfers: Transfer[]): Transfer[] {
  return [...transfers].sort(
    (a, b) =>
      a.gap - b.gap ||
      a.departDate.localeCompare(b.departDate) ||
      (a.departTime ?? "").localeCompare(b.departTime ?? "") ||
      a.createdAt - b.createdAt,
  );
}

/** True when the departure date falls outside the gap's dates (a warning, never blocks). */
export function outsideWindow(transfer: Transfer, gap: Gap | undefined): boolean {
  if (gap === undefined) {
    return false;
  }
  const { from, to } = gap.window;
  return (from !== null && transfer.departDate < from) || (to !== null && transfer.departDate > to);
}

function plain(name: string): string {
  return name.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}

/**
 * True when the gap is gone or its cities no longer match what was entered.
 * An outbound transfer may leave from anywhere and a return may end anywhere,
 * so only the destination (outbound) or the origin (return) is checked.
 */
export function routeChanged(transfer: Transfer, gap: Gap | undefined): boolean {
  if (gap === undefined) {
    return true;
  }
  const fromChanged = gap.from !== null && plain(transfer.from) !== plain(gap.from.name);
  const toChanged = gap.to !== null && plain(transfer.to) !== plain(gap.to.name);
  if (gap.kind === "outbound") {
    return toChanged;
  }
  if (gap.kind === "return") {
    return fromChanged;
  }
  return fromChanged || toChanged;
}

/** The cost for one traveler, in trip-currency minor units; null without a cost. */
export function costInTripCurrency(transfer: Transfer): number | null {
  if (transfer.cost === null) {
    return null;
  }
  return Math.round(transfer.cost * Number(transfer.rate ?? "1"));
}

/** Departed already; a transfer with no time counts as upcoming until its (UTC) day ends. */
export function isPast(
  transfer: Pick<Transfer, "departDate" | "departTime" | "departTz">,
  now: number,
): boolean {
  if (transfer.departTime === null) {
    return now >= Date.parse(`${transfer.departDate}T00:00:00Z`) + DAY_MS;
  }
  const departs = instantOf(transfer.departDate, transfer.departTime, transfer.departTz ?? "UTC");
  return departs !== null && departs < now;
}
