import { z } from "zod";
import { errorResponse, localeOf, parseBody } from "@/app/_composition/api-errors";
import { agent } from "@/app/_composition/trip-context";
import { getCurrentUser } from "@/modules/auth";

type Context = { params: Promise<{ tripId: string }> };

const bodySchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(4000) }))
    .min(1)
    .max(40),
});

// Web search plus a few tool steps can take a while.
export const maxDuration = 60;

export async function POST(request: Request, { params }: Context) {
  const currentUser = await getCurrentUser();
  if (currentUser === null) {
    return await errorResponse(request, "UNAUTHENTICATED");
  }
  if (!agent.isEnabled()) {
    return await errorResponse(request, "AGENT_UNAVAILABLE");
  }
  const body = await parseBody(request, bodySchema);
  if (!body.ok) {
    return body.response;
  }
  const { tripId } = await params;
  const result = await agent.askAgent({
    userId: currentUser.id,
    tripId,
    locale: localeOf(request),
    today: new Date().toISOString().slice(0, 10),
    messages: body.data.messages,
  });
  return result.ok ? Response.json(result.value) : await errorResponse(request, result.error.code);
}
