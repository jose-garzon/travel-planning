import { errorResponse } from "@/app/_composition/api-errors";
import { tripMembers } from "@/app/_composition/trip-members";
import { getCurrentUser } from "@/modules/auth";

type Context = { params: Promise<{ tripId: string }> };

/** A new invite link with a new expiry; the old one stops working. Owner only. */
export async function POST(request: Request, { params }: Context) {
  const currentUser = await getCurrentUser();
  if (currentUser === null) {
    return await errorResponse(request, "UNAUTHENTICATED");
  }

  const { tripId } = await params;
  const result = await tripMembers.resetInvite({
    userId: currentUser.id,
    tripId,
    origin: new URL(request.url).origin,
    now: new Date(),
  });

  return result.ok ? Response.json(result.value) : await errorResponse(request, result.error.code);
}
