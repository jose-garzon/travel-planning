import { errorResponse } from "@/app/_composition/api-errors";
import { budget } from "@/app/_composition/trip-context";
import { getCurrentUser } from "@/modules/auth";

type Context = { params: Promise<{ tripId: string }> };

export async function GET(request: Request, { params }: Context) {
  const currentUser = await getCurrentUser();
  if (currentUser === null) {
    return await errorResponse(request, "UNAUTHENTICATED");
  }
  const { tripId } = await params;
  const result = await budget.getBudget({ userId: currentUser.id, tripId });
  return result.ok ? Response.json(result.value) : await errorResponse(request, result.error.code);
}
