import { errorResponse, localeOf } from "@/app/_composition/api-errors";
import { transfers } from "@/app/_composition/trip-context";
import { getCurrentUser } from "@/modules/auth";

type Context = { params: Promise<{ tripId: string; transferId: string }> };

async function setJoined(request: Request, { params }: Context, joined: boolean) {
  const currentUser = await getCurrentUser();
  if (currentUser === null) {
    return await errorResponse(request, "UNAUTHENTICATED");
  }
  const { tripId, transferId } = await params;
  const result = await transfers.setTransferParticipation({
    userId: currentUser.id,
    tripId,
    transferId,
    locale: localeOf(request),
    joined,
  });
  return result.ok
    ? new Response(null, { status: 204 })
    : await errorResponse(request, result.error.code);
}

/** Join the opt-in transfer as the signed-in member. */
export function PUT(request: Request, context: Context) {
  return setJoined(request, context, true);
}

/** Leave it. */
export function DELETE(request: Request, context: Context) {
  return setJoined(request, context, false);
}
