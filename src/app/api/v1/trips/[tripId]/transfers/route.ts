import { errorResponse, localeOf, parseBody } from "@/app/_composition/api-errors";
import { transfers } from "@/app/_composition/trip-context";
import { getCurrentUser } from "@/modules/auth";
import { transferInputSchema } from "@/modules/transfers";

type Context = { params: Promise<{ tripId: string }> };

export async function GET(request: Request, { params }: Context) {
  const currentUser = await getCurrentUser();
  if (currentUser === null) {
    return await errorResponse(request, "UNAUTHENTICATED");
  }
  const { tripId } = await params;
  const result = await transfers.listTransfers({
    userId: currentUser.id,
    tripId,
    locale: localeOf(request),
  });
  return result.ok ? Response.json(result.value) : await errorResponse(request, result.error.code);
}

export async function POST(request: Request, { params }: Context) {
  const currentUser = await getCurrentUser();
  if (currentUser === null) {
    return await errorResponse(request, "UNAUTHENTICATED");
  }
  const body = await parseBody(request, transferInputSchema);
  if (!body.ok) {
    return body.response;
  }
  const { tripId } = await params;
  const result = await transfers.createTransfer({
    userId: currentUser.id,
    tripId,
    locale: localeOf(request),
    input: body.data,
  });
  return result.ok
    ? Response.json(result.value, { status: 201 })
    : await errorResponse(request, result.error.code);
}
