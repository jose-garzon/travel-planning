import type { MembersRepository } from "@/modules/trips/service/ports";
import type { Result } from "@/shared/kernel/result";

export type LeaveTripCommand = { userId: string; tripId: string };

/** An editor leaves a trip; the owner cannot (`OWNER_CANNOT_LEAVE`). T05 implements it. */
export async function leaveTrip(
  _command: LeaveTripCommand,
  _deps: { members: MembersRepository },
): Promise<Result<void, { code: "TRIP_NOT_FOUND" | "OWNER_CANNOT_LEAVE" }>> {
  throw new Error("not implemented: T05");
}
