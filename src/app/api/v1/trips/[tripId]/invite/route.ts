import { errorResponse } from "@/app/_composition/api-errors";
import { tripMembers } from "@/app/_composition/trip-members";
import { getCurrentUser } from "@/modules/auth";

type Context = { params: Promise<{ tripId: string }> };

/** The trip's invite link, created when missing (feature 009 plan "Contracts"). Owner only. */
export async function POST(request: Request, { params }: Context) {
  const currentUser = await getCurrentUser();
  if (currentUser === null) {
    return await errorResponse(request, "UNAUTHENTICATED");
  }

  const { tripId } = await params;
  const result = await tripMembers.getOrCreateInvite({
    userId: currentUser.id,
    tripId,
    origin: new URL(request.url).origin,
    now: new Date(),
  });

  return result.ok ? Response.json(result.value) : await errorResponse(request, result.error.code);
}
