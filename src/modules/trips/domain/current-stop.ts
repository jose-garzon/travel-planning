/** The parts of a `RouteView` the rule reads (kept structural: `route-view` imports this file). */
type DatedRoute = {
  takeoff: { date: string | null } | null;
  stops: Array<{ arrive: string | null; depart: string | null }>;
  backHome: { date: string | null } | null;
};

const DAY_MS = 86_400_000;

/** Whole days from `from` to `to` (`YYYY-MM-DD`); negative when `to` is earlier. */
export function daysBetween({ from, to }: { from: string; to: string }): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);
}

/**
 * Index into `view.stops` of the current stop (feature.md "Current stop
 * rules"), or null when there is none: the trip is over, or the route
 * has no stops. Before the trip, and when every leg is undated, it is
 * the first stop. During the trip it is the dated stop whose stay
 * (arrival up to, not including, departure) includes `today`.
 */
export function currentStopIndex({
  view,
  today,
}: {
  view: DatedRoute;
  today: string;
}): number | null {
  const { stops } = view;
  if (stops.length === 0) {
    return null;
  }

  const dates = [
    view.takeoff?.date ?? null,
    ...stops.flatMap((stop) => [stop.arrive, stop.depart]),
    view.backHome?.date ?? null,
  ].filter((date): date is string => date !== null);
  const first = dates.reduce<string | null>((min, d) => (min === null || d < min ? d : min), null);
  const last = dates.reduce<string | null>((max, d) => (max === null || d > max ? d : max), null);

  if (first === null || today < first) {
    return 0;
  }
  if (last === null || today > last) {
    return null;
  }

  const during = stops.findIndex(
    (stop) =>
      stop.arrive !== null && stop.arrive <= today && (stop.depart === null || today < stop.depart),
  );
  // `today` is the trip's last day: nothing is "during" any more, the
  // last stop is still where the member is.
  return during === -1 ? stops.length - 1 : during;
}
