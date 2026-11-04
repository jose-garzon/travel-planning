import type { MembersRepository } from "@/modules/trips/service/ports";
import type { Result } from "@/shared/kernel/result";

export type RemoveMemberCommand = { userId: string; tripId: string; targetUserId: string };

/** Owner removes an editor (feature 009 plan "Contracts"). T05 implements it. */
export async function removeMember(
  _command: RemoveMemberCommand,
  _deps: { members: MembersRepository },
): Promise<Result<void, { code: "TRIP_NOT_FOUND" | "TRIP_FORBIDDEN" | "MEMBER_NOT_FOUND" }>> {
  throw new Error("not implemented: T05");
}
