import type { Trip } from "@/modules/trips/domain/trip";

/** Port the home summary use case reads trips through (plan "Contracts"). */
export type TripsReader = {
  listForEmail(email: string): Promise<Trip[]>;
};
