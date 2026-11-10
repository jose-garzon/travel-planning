import { errorResponse, parseBody } from "@/app/_composition/api-errors";
import { budget } from "@/app/_composition/trip-context";
import { getCurrentUser } from "@/modules/auth";
import { capInputSchema } from "@/modules/budget";

type Context = { params: Promise<{ tripId: string }> };

export async function PUT(request: Request, { params }: Context) {
  const currentUser = await getCurrentUser();
  if (currentUser === null) {
    return await errorResponse(request, "UNAUTHENTICATED");
  }
  const body = await parseBody(request, capInputSchema);
  if (!body.ok) {
    return body.response;
  }
  const { tripId } = await params;
  const result = await budget.setBudgetCap({ userId: currentUser.id, tripId, cap: body.data.cap });
  return result.ok
    ? new Response(null, { status: 204 })
    : await errorResponse(request, result.error.code);
}
