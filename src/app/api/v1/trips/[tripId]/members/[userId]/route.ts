import { errorResponse } from "@/app/_composition/api-errors";
import { tripMembers } from "@/app/_composition/trip-members";
import { getCurrentUser } from "@/modules/auth";

type Context = { params: Promise<{ tripId: string; userId: string }> };

/**
 * Removes a member (feature 009 plan "Contracts"). Deleting your own row is
 * leaving: the owner gets `OWNER_CANNOT_LEAVE`, an editor gets 204. Deleting
 * someone else is owner-only (`TRIP_FORBIDDEN` for an editor).
 */
export async function DELETE(request: Request, { params }: Context) {
  const currentUser = await getCurrentUser();
  if (currentUser === null) {
    return await errorResponse(request, "UNAUTHENTICATED");
  }

  const { tripId, userId } = await params;
  const result =
    userId === currentUser.id
      ? await tripMembers.leaveTrip({ userId: currentUser.id, tripId })
      : await tripMembers.removeMember({
          userId: currentUser.id,
          tripId,
          targetUserId: userId,
        });

  return result.ok
    ? new Response(null, { status: 204 })
    : await errorResponse(request, result.error.code);
}
