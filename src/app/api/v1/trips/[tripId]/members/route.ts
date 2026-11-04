import { errorResponse } from "@/app/_composition/api-errors";
import { tripMembers } from "@/app/_composition/trip-members";
import { getCurrentUser } from "@/modules/auth";

type Context = { params: Promise<{ tripId: string }> };

/** The travelers of a trip (feature 009 plan "Contracts"); non-members get 404. */
export async function GET(request: Request, { params }: Context) {
  const currentUser = await getCurrentUser();
  if (currentUser === null) {
    return await errorResponse(request, "UNAUTHENTICATED");
  }

  const { tripId } = await params;
  const result = await tripMembers.listTripMembers({ userId: currentUser.id, tripId });

  return result.ok
    ? Response.json({ items: result.value })
    : await errorResponse(request, result.error.code);
}
