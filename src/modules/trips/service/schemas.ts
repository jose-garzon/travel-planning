import { z } from "zod";
import type { CityRef, Trip } from "@/modules/trips/domain/trip";
import { tripDateRange } from "@/modules/trips/domain/trip";

export const cityRefSchema = z.object({
  cityId: z.string().nullable(),
  code: z.string().min(1),
  name: z.string().trim().min(1),
});

export const legInputSchema = z.object({
  from: cityRefSchema,
  to: cityRefSchema,
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
});

/**
 * Leg count is checked by the domain (`NO_LEGS`, `TOO_MANY_LEGS`), so
 * the API answers `ROUTE_INVALID` for them, not `VALIDATION_FAILED`.
 */
export const tripInputSchema = z.object({
  name: z.string().trim().min(1).max(60),
  currency: z.string().regex(/^[A-Z]{3}$/),
  legs: z.array(legInputSchema),
});

export type TripInput = z.infer<typeof tripInputSchema>;
export type LegInput = TripInput["legs"][number];
export type LegDto = LegInput;

export type TripDto = {
  id: string;
  name: string;
  currency: string;
  version: number;
  role: "owner";
  memberCount: number;
  startDate: string | null;
  endDate: string | null;
  legs: LegDto[];
};

/** Maps a trip to its API shape, with city names resolved by `localizeName`. */
export function toTripDto(trip: Trip, localizeName: (city: CityRef) => string): TripDto {
  const localized = (city: CityRef): CityRef => ({ ...city, name: localizeName(city) });

  return {
    id: trip.id,
    name: trip.name,
    currency: trip.currency,
    version: trip.version,
    role: trip.role,
    memberCount: trip.memberCount,
    ...tripDateRange(trip.legs),
    legs: trip.legs.map((leg) => ({
      from: localized(leg.from),
      to: localized(leg.to),
      date: leg.date,
    })),
  };
}
