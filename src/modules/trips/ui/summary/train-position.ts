/** Where today falls on a route, for the train marker on the ticket. */
export type TrainPosition = {
  /** Station the train is at or leaving (0 = origin). */
  station: number;
  /** 0..1 along the segment to the next station. */
  t: number;
  /** 0..1 along the whole route. */
  overall: number;
  state: "before" | "during";
};

const DAY = 86_400_000;

function days(iso: string): number {
  return Date.parse(`${iso}T00:00:00Z`) / DAY;
}

/**
 * `legDates[i]` is the day of leg i (leaving station i, arriving at
 * station i + 1). The train waits at the origin before the trip, then
 * sits at the last station reached, gliding toward the next one as the
 * stay runs out. Null once the trip is over or when there is no route.
 */
export function trainPosition(
  legDates: string[],
  endDate: string | null,
  today: string,
): TrainPosition | null {
  const stations = legDates.length + 1;
  const first = legDates[0];
  if (first === undefined) {
    return null;
  }
  const overall = (station: number, t: number) => (station + t) / (stations - 1);
  if (today < first) {
    return { station: 0, t: 0, overall: 0, state: "before" };
  }
  // Last station reached: arrival at station i is legDates[i - 1].
  let station = 1;
  for (let i = 1; i < legDates.length; i++) {
    const leaves = legDates[i];
    if (leaves !== undefined && leaves <= today) {
      station = i + 1;
    }
  }
  if (station === stations - 1) {
    if (endDate !== null && today > endDate) {
      return null;
    }
    return { station, t: 0, overall: 1, state: "during" };
  }
  const arrived = days(legDates[station - 1] ?? today);
  const leaves = days(legDates[station] ?? today);
  const span = leaves - arrived;
  const t = span <= 0 ? 0 : Math.min(1, Math.max(0, (days(today) - arrived) / span));
  return { station, t, overall: overall(station, t), state: "during" };
}
