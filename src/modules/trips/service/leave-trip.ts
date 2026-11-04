import type { MembersRepository } from "@/modules/trips/service/ports";
import type { Result } from "@/shared/kernel/result";
import { err, ok } from "@/shared/kernel/result";

export type LeaveTripCommand = { userId: string; tripId: string };

/** An editor leaves a trip; the owner cannot (`OWNER_CANNOT_LEAVE`). */
export async function leaveTrip(
  { userId, tripId }: LeaveTripCommand,
  { members }: { members: MembersRepository },
): Promise<Result<void, { code: "TRIP_NOT_FOUND" | "OWNER_CANNOT_LEAVE" }>> {
  const roster = await members.listForTrip(tripId);
  const self = roster.find((member) => member.userId === userId);
  if (self === undefined) {
    return err({ code: "TRIP_NOT_FOUND" });
  }
  if (self.role === "owner") {
    return err({ code: "OWNER_CANNOT_LEAVE" });
  }

  await members.remove(tripId, userId);

  return ok(undefined);
}
