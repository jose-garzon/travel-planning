import { errorResponse } from "@/app/_composition/api-errors";
import { tripMembers } from "@/app/_composition/trip-members";

type Context = { params: Promise<{ token: string }> };

/** What a visitor sees before joining (feature 009 plan "Contracts"); anyone may ask. */
export async function GET(request: Request, { params }: Context) {
  const { token } = await params;
  const result = await tripMembers.getInvitePreview({ token, now: new Date() });

  if (result.ok) {
    return Response.json(result.value);
  }
  const { code, ownerName } = result.error;

  return ownerName === undefined
    ? await errorResponse(request, code)
    : await errorResponse(request, code, { ownerName });
}
