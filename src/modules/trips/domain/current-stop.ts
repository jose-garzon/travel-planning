import { addDays, daysBetween } from "@/modules/trips/domain/days";
import type { RouteView } from "@/modules/trips/domain/route-view";
import { stopsFromLegs } from "@/modules/trips/domain/route-view";
import type { Leg } from "@/modules/trips/domain/trip";

export { daysBetween };

/**
 * Index into `view.stops` of the stop the traveler is at, or null
 * (feature.md "Current stop rules"): the first stop before the trip,
 * the stop whose stay covers today during it, none once back home.
 * Undated stops are never current, unless no leg has a date at all.
 */
export function currentStopIndex({
  view,
  today,
}: {
  view: RouteView;
  today: string;
}): number | null {
  const { stops, takeoff } = view;
  if (stops.length === 0) {
    return null;
  }
  if (takeoff?.date == null && stops.every((stop) => stop.arrive === null)) {
    return 0;
  }

  const firstDated = stops.findIndex((stop) => stop.arrive !== null);
  const firstArrive = stops[firstDated]?.arrive;
  if (firstArrive == null || today < firstArrive) {
    return firstDated === -1 ? null : 0;
  }

  let current = firstDated;
  stops.forEach((stop, index) => {
    if (stop.arrive !== null && stop.arrive <= today) {
      current = index;
    }
  });

  const stop = stops[current];
  const isLast = current === stops.length - 1;
  if (isLast && view.backHome !== null && stop?.depart != null && today >= stop.depart) {
    return null;
  }
  return current;
}

/**
 * A trip has ended the day after its last dated leg. A route that
 * does not return home gets one more day: its last leg is an arrival,
 * and the traveler stays there.
 */
export function tripHasEnded({ legs, today }: { legs: Leg[]; today: string }): boolean {
  const view = stopsFromLegs(legs);
  const last = [...legs].reverse().find((leg) => leg.date !== null);
  if (last?.date == null) {
    return false;
  }
  const end = view.backHome === null ? addDays(last.date, 1) : last.date;
  return end < today;
}
