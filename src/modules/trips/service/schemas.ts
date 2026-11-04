import { z } from "zod";
import type { CityRef, Role, Trip } from "@/modules/trips/domain/trip";
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
  role: Role;
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

/** A member of a trip with the name and email of their user (feature 009 "Contracts"). */
export type MemberDto = {
  userId: string;
  name: string;
  email: string;
  role: Role;
  joinedAt: string;
};

/** The invite link as the owner sees it; `url` is absolute, with no locale prefix (EC-9). */
export type InviteDto = {
  url: string;
  expiresAt: string;
};

export type InvitePreviewDto = {
  tripId: string;
  tripName: string;
  ownerName: string;
  startDate: string | null;
  endDate: string | null;
  memberCount: number;
};

export type JoinResultDto = {
  tripId: string;
  alreadyMember: boolean;
};
