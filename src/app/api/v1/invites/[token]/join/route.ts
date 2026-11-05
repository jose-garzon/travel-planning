import { errorResponse } from "@/app/_composition/api-errors";
import { tripMembers } from "@/app/_composition/trip-members";
import { getCurrentUser } from "@/modules/auth";

type Context = { params: Promise<{ token: string }> };

/** Joins the signed-in user through a link (feature 009 plan "Contracts"). */
export async function POST(request: Request, { params }: Context) {
  const currentUser = await getCurrentUser();
  if (currentUser === null) {
    return await errorResponse(request, "UNAUTHENTICATED");
  }

  const { token } = await params;
  const result = await tripMembers.joinTrip({ userId: currentUser.id, token, now: new Date() });

  return result.ok ? Response.json(result.value) : await errorResponse(request, result.error.code);
}
