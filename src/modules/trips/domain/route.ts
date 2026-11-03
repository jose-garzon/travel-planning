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
export function isSameCity(a: CityRef, b: CityRef): boolean {
  if (a.cityId !== null && b.cityId !== null) {
    return a.cityId === b.cityId;
  }
  return normalizedName(a) === normalizedName(b);
}

/**
 * Route rules (plan "Contracts"). `DATE_PAST` applies to new dates only:
 * with `previousLegs` (update), a date unchanged at the same position is
 * kept even when it has since passed.
 */
export function validateRoute({ legs, today, previousLegs }: RouteInput): RouteViolation[] {
  if (legs.length === 0) {
    return [{ legIndex: null, rule: "NO_LEGS" }];
  }
  if (legs.length > MAX_LEGS) {
    return [{ legIndex: null, rule: "TOO_MANY_LEGS" }];
  }

  let lastDate: string | null = null;

  return legs.flatMap((leg, legIndex): RouteViolation[] => {
    const violations: RouteViolation[] = [];
    if (isSameCity(leg.from, leg.to)) {
      violations.push({ legIndex, rule: "SAME_CITY" });
    }
    if (leg.date !== null) {
      if (lastDate !== null && leg.date < lastDate) {
        violations.push({ legIndex, rule: "DATE_ORDER" });
      }
      const isUnchanged = previousLegs?.[legIndex]?.date === leg.date;
      if (leg.date < today && !isUnchanged) {
        violations.push({ legIndex, rule: "DATE_PAST" });
      }
      lastDate = leg.date;
    }

    return violations;
  });
}
