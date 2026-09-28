import "server-only";
import type { Trip } from "@/modules/trips/domain/trip";
import type { TripsReader } from "@/modules/trips/service/ports";

/**
 * T00 stub (plan D-4): always empty, no persistence. T03 replaces this
 * body with the `+trips` / `+pasttrips` email-pattern fixture — same
 * class, same port, so `trips/index.ts`'s wiring does not change.
 */
export class InMemoryTripsReader implements TripsReader {
  async listForEmail(_email: string): Promise<Trip[]> {
    return [];
  }
}
