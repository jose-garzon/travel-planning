import { errorResponse, parseBody } from "@/app/_composition/api-errors";
import { budget } from "@/app/_composition/trip-context";
import { getCurrentUser } from "@/modules/auth";
import { budgetItemInputSchema } from "@/modules/budget";

type Context = { params: Promise<{ tripId: string; itemId: string }> };

export async function PUT(request: Request, { params }: Context) {
  const currentUser = await getCurrentUser();
  if (currentUser === null) {
    return await errorResponse(request, "UNAUTHENTICATED");
  }
  const body = await parseBody(request, budgetItemInputSchema);
  if (!body.ok) {
    return body.response;
  }
  const { tripId, itemId } = await params;
  const result = await budget.updateBudgetItem({
    userId: currentUser.id,
    tripId,
    itemId,
    input: body.data,
  });
  return result.ok ? Response.json(result.value) : await errorResponse(request, result.error.code);
}

export async function DELETE(request: Request, { params }: Context) {
  const currentUser = await getCurrentUser();
  if (currentUser === null) {
    return await errorResponse(request, "UNAUTHENTICATED");
  }
  const { tripId, itemId } = await params;
  const result = await budget.deleteBudgetItem({ userId: currentUser.id, tripId, itemId });
  return result.ok
    ? new Response(null, { status: 204 })
    : await errorResponse(request, result.error.code);
}
