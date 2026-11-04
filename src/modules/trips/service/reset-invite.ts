import type { InviteDeps } from "@/modules/trips/service/get-or-create-invite";
import type { InviteDto } from "@/modules/trips/service/schemas";
import type { Result } from "@/shared/kernel/result";

export type ResetInviteCommand = {
  userId: string;
  tripId: string;
  origin: string;
  now: Date;
};

/** A new token and expiry; the old link stops working (owner only). T02 implements it. */
export async function resetInvite(
  _command: ResetInviteCommand,
  _deps: InviteDeps,
): Promise<Result<InviteDto, { code: "TRIP_NOT_FOUND" | "TRIP_FORBIDDEN" }>> {
  throw new Error("not implemented: T02");
}
