import { daysBetween } from "@/modules/trips/domain/days";
import type { CityRef, Leg } from "@/modules/trips/domain/trip";

export type StopView = {
  city: CityRef;
  /** A leg's date is its arrival day at `to` (same-day travel). */
  arrive: string | null;
  /** The next leg's date: when the traveler moves on. */
  depart: string | null;
  nights: number | null;
  /** 1-based place among the stops, excluding takeoff and back home. */
  position: number;
  total: number;
};

export type RouteView = {
  takeoff: { city: CityRef; date: string | null } | null;
  stops: StopView[];
  backHome: { city: CityRef; date: string | null } | null;
};

function sameCity(a: CityRef, b: CityRef): boolean {
  if (a.cityId !== null && b.cityId !== null) {
    return a.cityId === b.cityId;
  }
  return a.name.trim().toLowerCase() === b.name.trim().toLowerCase();
}

/**
 * The route as takeoff, stops and back home (feature.md "Concepts").
 * Stops are derived from the legs, never stored: the final leg is
 * "back home" when it returns to the first origin.
 */
export function stopsFromLegs(legs: Leg[]): RouteView {
  const first = legs[0];
  const last = legs[legs.length - 1];
  if (first === undefined || last === undefined) {
    return { takeoff: null, stops: [], backHome: null };
  }

  const returnsHome = legs.length > 1 && sameCity(last.to, first.from);
  const stopLegs = returnsHome ? legs.slice(0, -1) : legs;

  return {
    takeoff: { city: first.from, date: first.date },
    stops: stopLegs.map((leg, index) => {
      const depart = legs[index + 1]?.date ?? null;
      return {
        city: leg.to,
        arrive: leg.date,
        depart,
        nights:
          leg.date !== null && depart !== null ? daysBetween({ from: leg.date, to: depart }) : null,
        position: index + 1,
        total: stopLegs.length,
      };
    }),
    backHome: returnsHome ? { city: last.to, date: last.date } : null,
  };
}
