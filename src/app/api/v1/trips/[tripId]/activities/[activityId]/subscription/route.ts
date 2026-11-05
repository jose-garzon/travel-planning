import { errorResponse } from "@/app/_composition/api-errors";
import { itinerary } from "@/app/_composition/trip-context";
import { getCurrentUser } from "@/modules/auth";

type Context = { params: Promise<{ tripId: string; activityId: string }> };

async function setSubscribed(request: Request, { params }: Context, subscribed: boolean) {
  const currentUser = await getCurrentUser();
  if (currentUser === null) {
    return await errorResponse(request, "UNAUTHENTICATED");
  }
  const { tripId, activityId } = await params;
  const result = await itinerary.setSubscription({
    userId: currentUser.id,
    tripId,
    activityId,
    subscribed,
  });
  return result.ok
    ? new Response(null, { status: 204 })
    : await errorResponse(request, result.error.code);
}

/** Subscribe the signed-in member to the activity. */
export function PUT(request: Request, context: Context) {
  return setSubscribed(request, context, true);
}

/** Unsubscribe the signed-in member. */
export function DELETE(request: Request, context: Context) {
  return setSubscribed(request, context, false);
}
