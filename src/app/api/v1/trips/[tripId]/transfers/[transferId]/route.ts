import { errorResponse, localeOf, parseBody } from "@/app/_composition/api-errors";
import { transfers } from "@/app/_composition/trip-context";
import { getCurrentUser } from "@/modules/auth";
import { transferUpdateSchema } from "@/modules/transfers";

type Context = { params: Promise<{ tripId: string; transferId: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const currentUser = await getCurrentUser();
  if (currentUser === null) {
    return await errorResponse(request, "UNAUTHENTICATED");
  }
  const body = await parseBody(request, transferUpdateSchema);
  if (!body.ok) {
    return body.response;
  }
  const { tripId, transferId } = await params;
  const result = await transfers.updateTransfer({
    userId: currentUser.id,
    tripId,
    transferId,
    locale: localeOf(request),
    input: body.data,
  });
  return result.ok ? Response.json(result.value) : await errorResponse(request, result.error.code);
}

export async function DELETE(request: Request, { params }: Context) {
  const currentUser = await getCurrentUser();
  if (currentUser === null) {
    return await errorResponse(request, "UNAUTHENTICATED");
  }
  const { tripId, transferId } = await params;
  const result = await transfers.deleteTransfer({
    userId: currentUser.id,
    tripId,
    transferId,
    locale: localeOf(request),
  });
  return result.ok
    ? new Response(null, { status: 204 })
    : await errorResponse(request, result.error.code);
}
