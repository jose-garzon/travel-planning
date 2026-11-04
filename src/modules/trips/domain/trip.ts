/** A city on a leg. `cityId` is null for free text (feature 005 "Alternate flows" 4a). */
export type CityRef = {
  cityId: string | null;
  code: string;
  name: string;
};

/** From city -> To city, with an optional `YYYY-MM-DD` departure date (feature.md "Concepts"). */
export type Leg = {
  from: CityRef;
  to: CityRef;
  date: string | null;
};

/** Members manage the trip, editors edit it (feature 009 plan D-5); no viewer role. */
export type Role = "owner" | "editor";

/** A trip as the signed-in member sees it. */
export type Trip = {
  id: string;
  name: string;
  currency: string;
  version: number;
  role: Role;
  memberCount: number;
  legs: Leg[];
};

export type DateRange = { startDate: string | null; endDate: string | null };

/** First dated leg to last dated leg (feature.md "Concepts"); both null when no leg has a date. */
export function tripDateRange(legs: Leg[]): DateRange {
  const dates = legs.flatMap((leg) => (leg.date === null ? [] : [leg.date]));

  return { startDate: dates[0] ?? null, endDate: dates[dates.length - 1] ?? null };
}
