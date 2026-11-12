import type { TripDto } from "@/modules/trips/service/schemas";

/**
 * What home needs to know about one activity. The app layer maps the
 * itinerary module's DTO onto this, so trips never imports itinerary
 * (architecture.md, "Crossing modules").
 */
export type HomeActivity = {
  id: string;
  /** `YYYY-MM-DD`. */
  date: string;
  title: string;
  /** `HH:MM`, 24h. */
  startTime: string | null;
  durationMinutes: number | null;
  /** The viewer has joined it. */
  subscribed: boolean;
  /** Members who joined it. */
  goingCount: number;
};

/**
 * The next transfer of the next trip, as home shows it. The app layer maps
 * the transfers module's DTO onto this (architecture.md, "Crossing modules").
 */
export type HomeTransfer = {
  id: string;
  mode: "flight" | "train" | "bus" | "ferry" | "car" | "other";
  from: string;
  to: string;
  /** `YYYY-MM-DD`, local to the departure city. */
  departDate: string;
  /** `HH:MM`, 24h, local to the departure city. */
  departTime: string | null;
  /** Whole days from the viewer's today to `departDate`; 0 on the day. */
  daysAway: number;
};

export type NextStopDay = {
  /** `YYYY-MM-DD`. */
  date: string;
  /** The city the crew wakes up in (or lands in) that day. */
  city: string;
  cityCode: string;
  /** Set when a leg arrives that day: the travel into `city`. */
  travel: { from: string; fromCode: string } | null;
  /** Index into `NextStop.stations` of the city the crew is in that day. */
  station: number;
  activities: HomeActivity[];
};

/** One station of the trip's line: the first origin, then every destination. */
export type NextStopStation = { code: string; name: string };

export type NextStop = {
  tripId: string;
  tripName: string;
  /** `YYYY-MM-DD`; the trip's first and last day. */
  startDate: string;
  endDate: string;
  /** Members on the trip. */
  crewCount: number;
  /** The whole route, in order, so the day can be placed on it. */
  stations: NextStopStation[];
  /** Whole days from today to `focus.date`; 0 when it is today. */
  daysAway: number;
  /** True when the trip is under way today. */
  underway: boolean;
  focus: NextStopDay;
  /** Up to three later days of this trip that have something planned. */
  later: NextStopDay[];
};

const DAY_MS = 86_400_000;
const LATER_DAYS = 3;

function dayDiff(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);
}

/** Where the trip is on `date`: the last leg that arrived on or before it. */
function dayOf(trip: TripDto, date: string, activities: HomeActivity[]): NextStopDay | null {
  const [first] = trip.legs;
  if (first === undefined) {
    return null;
  }
  const arrived = trip.legs.filter((leg) => leg.date !== null && leg.date <= date);
  const leg = arrived[arrived.length - 1] ?? first;

  return {
    date,
    city: leg.to.name,
    cityCode: leg.to.code,
    travel: leg.date === date ? { from: leg.from.name, fromCode: leg.from.code } : null,
    station: Math.max(arrived.length, 1),
    activities: activities.filter((activity) => activity.date === date),
  };
}

/**
 * The home spotlight for the next trip: the day that comes next (today
 * when the trip is under way, else its first day), the city of that
 * day, its activities, and the next few planned days after it. Null
 * when the trip has no dates or no route yet, or has already ended.
 * Pure: `today` is passed in.
 */
export function buildNextStop(
  trip: TripDto,
  activities: HomeActivity[],
  today: string,
): NextStop | null {
  if (trip.startDate === null || trip.endDate === null || trip.endDate < today) {
    return null;
  }
  const underway = trip.startDate <= today;
  const focusDate = underway ? today : trip.startDate;
  const focus = dayOf(trip, focusDate, activities);
  if (focus === null) {
    return null;
  }

  const laterDates = [...new Set(activities.map((a) => a.date))]
    .filter((date) => date > focusDate)
    .sort()
    .slice(0, LATER_DAYS);

  return {
    tripId: trip.id,
    tripName: trip.name,
    startDate: trip.startDate,
    endDate: trip.endDate,
    crewCount: trip.memberCount,
    stations: [
      { code: trip.legs[0]?.from.code ?? "", name: trip.legs[0]?.from.name ?? "" },
      ...trip.legs.map((leg) => ({ code: leg.to.code, name: leg.to.name })),
    ],
    daysAway: Math.max(0, dayDiff(today, focusDate)),
    underway,
    focus,
    later: laterDates
      .map((date) => dayOf(trip, date, activities))
      .filter((day): day is NextStopDay => day !== null),
  };
}
