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

/**
 * Route rules (plan "Contracts"). `today` and `previousLegs` belong to
 * the date rules (`DATE_ORDER`, `DATE_PAST`), added with the dates task.
 */
export function validateRoute({ legs }: RouteInput): RouteViolation[] {
  if (legs.length === 0) {
    return [{ legIndex: null, rule: "NO_LEGS" }];
  }
  if (legs.length > MAX_LEGS) {
    return [{ legIndex: null, rule: "TOO_MANY_LEGS" }];
  }

  return legs.flatMap((leg, legIndex): RouteViolation[] =>
    isSameCity(leg.from, leg.to) ? [{ legIndex, rule: "SAME_CITY" }] : [],
  );
}
