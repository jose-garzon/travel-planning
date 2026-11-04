import { isExpired } from "@/modules/trips/domain/invite";
import type { InvitesRepository, MembersRepository } from "@/modules/trips/service/ports";
import type { JoinResultDto } from "@/modules/trips/service/schemas";
import type { Result } from "@/shared/kernel/result";
import { err, ok } from "@/shared/kernel/result";

export type JoinTripCommand = { userId: string; token: string; now: Date };

/**
 * Adds the signed-in user as an editor through a live link. The insert is
 * one statement that also enforces the 20-member cap (EC-3); an existing
 * member is answered as `alreadyMember`, even on a full trip.
 */
export async function joinTrip(
  { userId, token, now }: JoinTripCommand,
  { invites, members }: { invites: InvitesRepository; members: MembersRepository },
): Promise<Result<JoinResultDto, { code: "INVITE_EXPIRED" | "TRIP_FULL" }>> {
  const invite = await invites.findByToken(token);
  if (invite === null || isExpired({ invite, now })) {
    return err({ code: "INVITE_EXPIRED" });
  }

  const outcome = await members.addIfRoom({
    tripId: invite.tripId,
    userId,
    role: "editor",
    joinedAt: now,
  });
  if (outcome === "full") {
    return err({ code: "TRIP_FULL" });
  }

  return ok({ tripId: invite.tripId, alreadyMember: outcome === "already" });
}
