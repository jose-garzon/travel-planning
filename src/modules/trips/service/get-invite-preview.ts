import type { InvitesRepository, UserProfiles } from "@/modules/trips/service/ports";
import type { InvitePreviewDto } from "@/modules/trips/service/schemas";
import type { Result } from "@/shared/kernel/result";

export type GetInvitePreviewQuery = { token: string; now: Date };

/** What a visitor sees before joining; expired and unknown links answer `INVITE_EXPIRED`. T04 implements it. */
export async function getInvitePreview(
  _query: GetInvitePreviewQuery,
  _deps: { invites: InvitesRepository; profiles: UserProfiles },
): Promise<Result<InvitePreviewDto, { code: "INVITE_EXPIRED" }>> {
  throw new Error("not implemented: T04");
}
