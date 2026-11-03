import { daysBetween } from "@/modules/trips/domain/current-stop";
import type { CityRef, Leg } from "@/modules/trips/domain/trip";

/** Start and end of the line: a city and the date the member leaves it. */
export type Hub = { code: string; name: string; date: string | null };

export type Stop = {
  code: string;
  name: string;
  /** 1-based position among the stops, and how many there are. */
  number: number;
  total: number;
  arrive: string | null;
  depart: string | null;
  /** Only when both dates are known. */
  nights: number | null;
};

/** Derived from legs, never stored (feature.md "Concepts"). */
export type RouteView = {
  takeoff: Hub | null;
  stops: Stop[];
  /** Present when the last leg returns to the first origin. */
  backHome: Hub | null;
};

function isSameCity(a: CityRef, b: CityRef): boolean {
  if (a.cityId !== null && b.cityId !== null) {
    return a.cityId === b.cityId;
  }
  return a.name.trim().toLowerCase() === b.name.trim().toLowerCase();
}

/** The first origin is the takeoff; every destination is a stop, except a final return home. */
export function stopsFromLegs(legs: Leg[]): RouteView {
  const [first] = legs;
  const last = legs[legs.length - 1];
  if (first === undefined || last === undefined) {
    return { takeoff: null, stops: [], backHome: null };
  }

  const returnsHome = legs.length > 1 && isSameCity(last.to, first.from);
  const stopLegs = returnsHome ? legs.slice(0, -1) : legs;

  return {
    takeoff: { code: first.from.code, name: first.from.name, date: first.date },
    stops: stopLegs.map((leg, index) => {
      const depart = legs[index + 1]?.date ?? null;
      return {
        code: leg.to.code,
        name: leg.to.name,
        number: index + 1,
        total: stopLegs.length,
        arrive: leg.date,
        depart,
        nights:
          leg.date !== null && depart !== null ? daysBetween({ from: leg.date, to: depart }) : null,
      };
    }),
    backHome: returnsHome ? { code: last.to.code, name: last.to.name, date: last.date } : null,
  };
}
