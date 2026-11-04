import type { InvitesRepository, UserProfiles } from "@/modules/trips/service/ports";
import type { InvitePreviewDto } from "@/modules/trips/service/schemas";
import type { Result } from "@/shared/kernel/result";
import { err, ok } from "@/shared/kernel/result";

export type GetInvitePreviewQuery = { token: string; now: Date };

/**
 * What a visitor sees before joining. Expired, reset, unknown and
 * deleted-trip links all answer `INVITE_EXPIRED`: the repository finds
 * nothing for a reset token or a deleted trip, and the expiry is checked here.
 */
export async function getInvitePreview(
  { token, now }: GetInvitePreviewQuery,
  { invites, profiles }: { invites: InvitesRepository; profiles: UserProfiles },
): Promise<Result<InvitePreviewDto, { code: "INVITE_EXPIRED"; ownerName?: string }>> {
  const record = await invites.findPreviewByToken(token);
  if (record === null) {
    return err({ code: "INVITE_EXPIRED" });
  }

  const [owner] = await profiles.getMany([record.ownerId]);
  const ownerName = owner?.name ?? "";
  if (now.getTime() >= record.expiresAt.getTime()) {
    // The link exists but has expired: the page can say whom to ask (plan D-8).
    return err({ code: "INVITE_EXPIRED", ownerName });
  }

  return ok({
    tripId: record.tripId,
    tripName: record.tripName,
    ownerName,
    startDate: record.startDate,
    endDate: record.endDate,
    memberCount: record.memberCount,
  });
}
