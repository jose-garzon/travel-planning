// Activity rules (feature itinerary plan "Domain"). Pure: no I/O, no clock.

export type Activity = {
  id: string;
  tripId: string;
  /** `YYYY-MM-DD`, a day of the trip. */
  date: string;
  title: string;
  /** `HH:MM`, 24h, local to the destination. */
  startTime: string | null;
  durationMinutes: number | null;
  /** Minor units in `currency`. */
  costPerPerson: number | null;
  currency: string | null;
  /** Trip-currency units per one unit of `currency`, as a decimal string. */
  rate: string | null;
  link: string | null;
  createdBy: string;
  participantIds: string[];
};

export const MAX_ACTIVITIES_PER_TRIP = 300;

function minutesOf(time: string): number {
  const [hours = "0", minutes = "0"] = time.split(":");
  return Number(hours) * 60 + Number(minutes);
}

/** Start and end in minutes from midnight; an activity with no duration is a point in time. */
function span(activity: Pick<Activity, "startTime" | "durationMinutes">) {
  if (activity.startTime === null) {
    return null;
  }
  const start = minutesOf(activity.startTime);
  return { start, end: start + (activity.durationMinutes ?? 0) };
}

/** True when two timed activities on the same day share any minute. */
export function overlaps(a: Activity, b: Activity): boolean {
  if (a.id === b.id || a.date !== b.date) {
    return false;
  }
  const sa = span(a);
  const sb = span(b);
  if (sa === null || sb === null) {
    return false;
  }
  if (sa.start === sb.start) {
    return true;
  }
  return sa.start < sb.end && sb.start < sa.end;
}

/** Ids of every activity that overlaps another one (warning only, never blocks a save). */
export function overlappingIds(activities: Activity[]): Set<string> {
  const ids = new Set<string>();
  for (const a of activities) {
    for (const b of activities) {
      if (overlaps(a, b)) {
        ids.add(a.id);
      }
    }
  }
  return ids;
}

/** Calendar order: by day, untimed first, then by start time, then title. */
export function sortActivities(activities: Activity[]): Activity[] {
  return [...activities].sort((a, b) => {
    if (a.date !== b.date) {
      return a.date < b.date ? -1 : 1;
    }
    const ta = a.startTime ?? "";
    const tb = b.startTime ?? "";
    if (ta !== tb) {
      return ta < tb ? -1 : 1;
    }
    return a.title.localeCompare(b.title);
  });
}

/** The activity's cost for one participant, in trip-currency minor units. */
export function costInTripCurrency(activity: Activity): number {
  if (activity.costPerPerson === null) {
    return 0;
  }
  return Math.round(activity.costPerPerson * Number(activity.rate ?? "1"));
}

export type DateViolation = "OUTSIDE_TRIP";

/** An activity must fall inside the trip dates when the trip has them. */
export function checkDate(
  date: string,
  range: { startDate: string | null; endDate: string | null },
): DateViolation | null {
  if (range.startDate !== null && date < range.startDate) {
    return "OUTSIDE_TRIP";
  }
  if (range.endDate !== null && date > range.endDate) {
    return "OUTSIDE_TRIP";
  }
  return null;
}
