// Route gaps (feature 015 plan "Contracts"). Pure: no I/O, no clock.

export type GapCity = { name: string; code: string; tz: string | null };

export type RouteLeg = { from: GapCity; to: GapCity; date: string | null };
export type Route = { legs: RouteLeg[] };

export type GapKind = "outbound" | "between" | "return";

export type Gap = {
  index: number;
  kind: GapKind;
  from: GapCity | null;
  to: GapCity | null;
  date: string | null;
  /** Dates a transfer in this gap is expected to depart on, bounds included. */
  window: { from: string | null; to: string | null };
};

function sameCity(a: GapCity, b: GapCity): boolean {
  return a.code === b.code && a.name === b.name;
}

/**
 * One gap per leg (leg `g` is gap `g`), plus a return gap from the last stop
 * to the origin unless the last leg already ends there. A leg that ends at
 * the origin is the return.
 */
export function gapsOf(route: Route): Gap[] {
  const { legs } = route;
  const first = legs[0];
  const last = legs.at(-1);
  if (first === undefined || last === undefined) {
    return [];
  }
  const gaps = legs.map((leg, index): Gap => {
    const endsAtOrigin = index > 0 && sameCity(leg.to, first.from);
    return {
      index,
      kind: index === 0 ? "outbound" : endsAtOrigin ? "return" : "between",
      from: leg.from,
      to: leg.to,
      date: leg.date,
      window: { from: legs[index - 1]?.date ?? null, to: leg.date },
    };
  });
  if (!sameCity(last.to, first.from)) {
    gaps.push({
      index: legs.length,
      kind: "return",
      from: last.to,
      to: first.from,
      date: null,
      window: { from: last.date, to: null },
    });
  }
  return gaps;
}
