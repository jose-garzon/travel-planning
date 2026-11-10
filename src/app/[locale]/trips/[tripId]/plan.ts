/** A stop of the route: where the trip is between two departures. */
export type PlanStop = { city: string; from: string | null; to: string | null };

export type PlanGroup<A, C> = {
  /** Leg position of the stop; null is the whole-trip group. */
  stop: number | null;
  activities: A[];
  costs: C[];
};

/**
 * Splits the itinerary and the costs by stop. An activity belongs to
 * the stop whose days hold its date (a travel day counts for the
 * arrival); a cost carries its stop. What fits no stop (undated legs,
 * stops removed since) goes to the whole-trip group, always last.
 */
export function groupByStop<A extends { date: string }, C extends { stop: number | null }>(
  stops: PlanStop[],
  activities: A[],
  costs: C[],
): PlanGroup<A, C>[] {
  const groups: PlanGroup<A, C>[] = stops.map((_, index) => ({
    stop: index,
    activities: [],
    costs: [],
  }));
  const whole: PlanGroup<A, C> = { stop: null, activities: [], costs: [] };
  const dated = stops.every((stop) => stop.from !== null);

  for (const activity of activities) {
    const index = dated ? stopFor(stops, activity.date) : -1;
    (groups[index] ?? whole).activities.push(activity);
  }
  for (const cost of costs) {
    const group = cost.stop === null ? undefined : groups[cost.stop];
    (group ?? whole).costs.push(cost);
  }
  return [...groups, whole];
}

function stopFor(stops: PlanStop[], date: string): number {
  let found = -1;
  stops.forEach((stop, index) => {
    if (stop.from !== null && date >= stop.from) {
      found = index;
    }
  });
  const last = stops.at(-1)?.to;
  if (found === -1 || (found === stops.length - 1 && last != null && date > last)) {
    return -1;
  }
  return found;
}

/**
 * The stop the trip is at today: its first day reached, its departure
 * not yet. The last stop runs to the trip's end. -1 when today is
 * outside every dated stop.
 */
export function currentStop(stops: PlanStop[], today: string, endDate: string | null): number {
  return stops.findIndex(
    (stop) =>
      stop.from !== null &&
      stop.from <= today &&
      (stop.to === null ? endDate === null || today <= endDate : today < stop.to),
  );
}
