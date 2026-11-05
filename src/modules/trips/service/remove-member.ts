import { canManageMembers } from "@/modules/trips/domain/membership";
import type { MembersRepository } from "@/modules/trips/service/ports";
import type { Result } from "@/shared/kernel/result";
import { err, ok } from "@/shared/kernel/result";

export type RemoveMemberCommand = { userId: string; tripId: string; targetUserId: string };

/**
 * Owner removes an editor (feature 009 plan "Contracts"). An editor who
 * tries it gets `TRIP_FORBIDDEN` whoever the target is (D-5). The owner's
 * own row is never removed here: leaving goes through `leaveTrip`.
 */
export async function removeMember(
  { userId, tripId, targetUserId }: RemoveMemberCommand,
  { members }: { members: MembersRepository },
): Promise<Result<void, { code: "TRIP_NOT_FOUND" | "TRIP_FORBIDDEN" | "MEMBER_NOT_FOUND" }>> {
  const roster = await members.listForTrip(tripId);
  const caller = roster.find((member) => member.userId === userId);
  if (caller === undefined) {
    return err({ code: "TRIP_NOT_FOUND" });
  }
  if (!canManageMembers(caller.role)) {
    return err({ code: "TRIP_FORBIDDEN" });
  }

  const target = roster.find((member) => member.userId === targetUserId);
  if (target === undefined) {
    return err({ code: "MEMBER_NOT_FOUND" });
  }
  // The trip always keeps its owner; the owner leaves through `leaveTrip` (which refuses).
  if (target.role === "owner") {
    return err({ code: "TRIP_FORBIDDEN" });
  }

  await members.remove(tripId, targetUserId);

  return ok(undefined);
}
