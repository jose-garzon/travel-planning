import { errorResponse, parseBody } from "@/app/_composition/api-errors";
import { itinerary } from "@/app/_composition/trip-context";
import { getCurrentUser } from "@/modules/auth";
import { activityInputSchema } from "@/modules/itinerary";

type Context = { params: Promise<{ tripId: string; activityId: string }> };

export async function PUT(request: Request, { params }: Context) {
  const currentUser = await getCurrentUser();
  if (currentUser === null) {
    return await errorResponse(request, "UNAUTHENTICATED");
  }
  const body = await parseBody(request, activityInputSchema);
  if (!body.ok) {
    return body.response;
  }
  const { tripId, activityId } = await params;
  const result = await itinerary.updateActivity({
    userId: currentUser.id,
    tripId,
    activityId,
    input: body.data,
  });
  return result.ok ? Response.json(result.value) : await errorResponse(request, result.error.code);
}

export async function DELETE(request: Request, { params }: Context) {
  const currentUser = await getCurrentUser();
  if (currentUser === null) {
    return await errorResponse(request, "UNAUTHENTICATED");
  }
  const { tripId, activityId } = await params;
  const result = await itinerary.deleteActivity({ userId: currentUser.id, tripId, activityId });
  return result.ok
    ? new Response(null, { status: 204 })
    : await errorResponse(request, result.error.code);
}
