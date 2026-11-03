import type { Trip } from "@/modules/trips/domain/trip";
import type { TripInput } from "@/modules/trips/service/schemas";
import type { Locale } from "@/shared/i18n/routing";

export type CreateTripRecord = {
  ownerId: string;
  input: TripInput;
  now: Date;
};

/** Persistence port. `create` saves the trip and its owner membership atomically. */
export type TripRepository = {
  create(record: CreateTripRecord): Promise<Trip>;
  /** Every trip the user is a member of, with legs, in at most 2 queries. */
  listForUser(userId: string): Promise<Trip[]>;
};

export type UpdateTripRecord = {
  tripId: string;
  input: TripInput;
  /** The write only lands when the stored version still equals this. */
  expectedVersion: number;
  now: Date;
};

/** Persistence port for reading one trip, editing and deleting it. */
export type TripEditRepository = {
  /** The trip with the member's role; null when missing or the user is not a member. */
  findForMember(tripId: string, userId: string): Promise<Trip | null>;
  /** Replaces name, currency and legs and bumps the version; null when the version is stale. */
  update(record: UpdateTripRecord): Promise<Trip | null>;
  /** Removes the trip with its members and legs. */
  remove(tripId: string): Promise<void>;
};

/** City names port: localizes a stored city for the request locale. */
export type CityNames = {
  localizeName(city: { cityId: string | null; name: string }, locale: Locale): string;
};
