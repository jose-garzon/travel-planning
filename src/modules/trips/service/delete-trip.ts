import type { TripEditRepository } from "@/modules/trips/service/ports";
import type { Result } from "@/shared/kernel/result";
import { err, ok } from "@/shared/kernel/result";

export type DeleteTripCommand = { userId: string; tripId: string };

export type DeleteTripError = { code: "TRIP_NOT_FOUND" } | { code: "TRIP_FORBIDDEN" };

/** Deletes a trip (and its members and legs) for its owner. */
export async function deleteTrip(
  { userId, tripId }: DeleteTripCommand,
  { trips }: { trips: TripEditRepository },
): Promise<Result<undefined, DeleteTripError>> {
  const current = await trips.findForMember(tripId, userId);
  if (current === null) {
    return err({ code: "TRIP_NOT_FOUND" });
  }
  if ((current.role as string) !== "owner") {
    return err({ code: "TRIP_FORBIDDEN" });
  }

  await trips.remove(tripId);

  return ok(undefined);
}
