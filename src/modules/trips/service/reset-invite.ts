import type { InviteDeps, InviteError } from "@/modules/trips/service/get-or-create-invite";
import { newInvite, requireOwner, toInviteDto } from "@/modules/trips/service/get-or-create-invite";
import type { InviteDto } from "@/modules/trips/service/schemas";
import type { Result } from "@/shared/kernel/result";
import { ok } from "@/shared/kernel/result";

export type ResetInviteCommand = {
  userId: string;
  tripId: string;
  origin: string;
  now: Date;
};

/** A new token and expiry; the old link stops working (owner only). */
export async function resetInvite(
  { userId, tripId, origin, now }: ResetInviteCommand,
  deps: InviteDeps,
): Promise<Result<InviteDto, InviteError>> {
  const owner = await requireOwner({ userId, tripId }, deps);
  if (!owner.ok) {
    return owner;
  }

  const stored = await deps.invites.replace(newInvite(tripId, now, deps.tokens));

  return ok(toInviteDto(stored, origin));
}
