import type { TripEditRepository } from "@/modules/trips/service/ports";
import type { Result } from "@/shared/kernel/result";
import { err, ok } from "@/shared/kernel/result";

export type DeleteTripCommand = { tripId: string; userId: string };

/** Owner-only hard delete; legs and members cascade in the database. */
export async function deleteTrip(
  { tripId, userId }: DeleteTripCommand,
  { trips }: { trips: TripEditRepository },
): Promise<Result<void, { code: "TRIP_NOT_FOUND" } | { code: "TRIP_FORBIDDEN" }>> {
  const current = await trips.findForUser(tripId, userId);
  if (current === null) {
    return err({ code: "TRIP_NOT_FOUND" });
  }
  if (current.role !== "owner") {
    return err({ code: "TRIP_FORBIDDEN" });
  }

  await trips.delete(tripId);

  return ok(undefined);
}
