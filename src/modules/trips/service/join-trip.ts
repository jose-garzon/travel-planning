import type { InvitesRepository, MembersRepository } from "@/modules/trips/service/ports";
import type { JoinResultDto } from "@/modules/trips/service/schemas";
import type { Result } from "@/shared/kernel/result";

export type JoinTripCommand = { userId: string; token: string; now: Date };

/** Adds the signed-in user as an editor through a valid link. T04 implements it. */
export async function joinTrip(
  _command: JoinTripCommand,
  _deps: { invites: InvitesRepository; members: MembersRepository },
): Promise<Result<JoinResultDto, { code: "INVITE_EXPIRED" | "TRIP_FULL" }>> {
  throw new Error("not implemented: T04");
}
