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
