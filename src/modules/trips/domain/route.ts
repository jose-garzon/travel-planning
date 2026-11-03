import type { CityRef, Leg } from "@/modules/trips/domain/trip";

export type RouteRule = "SAME_CITY" | "DATE_ORDER" | "DATE_PAST" | "TOO_MANY_LEGS" | "NO_LEGS";

/** `legIndex` is null for rules about the route as a whole. */
export type RouteViolation = { legIndex: number | null; rule: RouteRule };

export type RouteInput = {
  legs: Leg[];
  today: string;
  previousLegs?: Leg[];
};

const MAX_LEGS = 10;

function normalizedName(city: CityRef): string {
  return city.name.trim().toLowerCase();
}

/** Same id when both are known cities; otherwise free text compared by name. */
function isSameCity(a: CityRef, b: CityRef): boolean {
  if (a.cityId !== null && b.cityId !== null) {
    return a.cityId === b.cityId;
  }
  return normalizedName(a) === normalizedName(b);
}

/** The date a leg must be on or after: the latest earlier dated leg (undated legs are skipped). */
export function previousDate(legs: Leg[], legIndex: number): string | null {
  const earlier = legs.slice(0, legIndex).flatMap((leg) => (leg.date === null ? [] : [leg.date]));

  return earlier.reduce<string | null>(
    (max, date) => (max === null || date > max ? date : max),
    null,
  );
}

function dateViolations({ legs, today, previousLegs }: RouteInput): RouteViolation[] {
  return legs.flatMap((leg, legIndex): RouteViolation[] => {
    if (leg.date === null) {
      return [];
    }
    const violations: RouteViolation[] = [];
    const before = previousDate(legs, legIndex);
    if (before !== null && leg.date < before) {
      violations.push({ legIndex, rule: "DATE_ORDER" });
    }
    // On update only a new or changed date is checked against today.
    const isChanged = previousLegs === undefined || previousLegs[legIndex]?.date !== leg.date;
    if (isChanged && leg.date < today) {
      violations.push({ legIndex, rule: "DATE_PAST" });
    }
    return violations;
  });
}

/** Route rules (plan "Contracts"). */
export function validateRoute(input: RouteInput): RouteViolation[] {
  const { legs } = input;
  if (legs.length === 0) {
    return [{ legIndex: null, rule: "NO_LEGS" }];
  }
  if (legs.length > MAX_LEGS) {
    return [{ legIndex: null, rule: "TOO_MANY_LEGS" }];
  }

  const sameCity = legs.flatMap((leg, legIndex): RouteViolation[] =>
    isSameCity(leg.from, leg.to) ? [{ legIndex, rule: "SAME_CITY" }] : [],
  );

  return [...sameCity, ...dateViolations(input)];
}
