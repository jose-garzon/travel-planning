import { errorResponse, parseBody } from "@/app/_composition/api-errors";
import { itinerary } from "@/app/_composition/trip-context";
import { getCurrentUser } from "@/modules/auth";
import { activityInputSchema } from "@/modules/itinerary";

type Context = { params: Promise<{ tripId: string }> };

export async function GET(request: Request, { params }: Context) {
  const currentUser = await getCurrentUser();
  if (currentUser === null) {
    return await errorResponse(request, "UNAUTHENTICATED");
  }
  const { tripId } = await params;
  const result = await itinerary.listActivities({ userId: currentUser.id, tripId });
  return result.ok ? Response.json(result.value) : await errorResponse(request, result.error.code);
}

export async function POST(request: Request, { params }: Context) {
  const currentUser = await getCurrentUser();
  if (currentUser === null) {
    return await errorResponse(request, "UNAUTHENTICATED");
  }
  const body = await parseBody(request, activityInputSchema);
  if (!body.ok) {
    return body.response;
  }
  const { tripId } = await params;
  const result = await itinerary.createActivity({
    userId: currentUser.id,
    tripId,
    input: body.data,
  });
  return result.ok
    ? Response.json(result.value, { status: 201 })
    : await errorResponse(request, result.error.code);
}
