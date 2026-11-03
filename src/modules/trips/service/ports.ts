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

/** City names port: localizes a stored city for the request locale. */
export type CityNames = {
  localizeName(city: { cityId: string | null; name: string }, locale: Locale): string;
};

export type UpdateTripRecord = {
  tripId: string;
  input: TripInput;
  /** The version the client read; the write only applies when it is still current. */
  expectedVersion: number;
  now: Date;
};

/** Persistence port for reading, editing and deleting one trip. */
export type TripEditRepository = {
  /** The trip with the user's role, or null when it is missing or the user is not a member. */
  findForUser(tripId: string, userId: string): Promise<Trip | null>;
  /** Replaces name, currency and legs and bumps the version; null when `expectedVersion` is stale. */
  update(record: UpdateTripRecord): Promise<Trip | null>;
  /** Hard delete; legs and members cascade. */
  delete(tripId: string): Promise<void>;
};
