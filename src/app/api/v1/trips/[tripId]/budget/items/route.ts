import { errorResponse, parseBody } from "@/app/_composition/api-errors";
import { budget } from "@/app/_composition/trip-context";
import { getCurrentUser } from "@/modules/auth";
import { budgetItemInputSchema } from "@/modules/budget";

type Context = { params: Promise<{ tripId: string }> };

export async function POST(request: Request, { params }: Context) {
  const currentUser = await getCurrentUser();
  if (currentUser === null) {
    return await errorResponse(request, "UNAUTHENTICATED");
  }
  const body = await parseBody(request, budgetItemInputSchema);
  if (!body.ok) {
    return body.response;
  }
  const { tripId } = await params;
  const result = await budget.createBudgetItem({
    userId: currentUser.id,
    tripId,
    input: body.data,
  });
  return result.ok
    ? Response.json(result.value, { status: 201 })
    : await errorResponse(request, result.error.code);
}
