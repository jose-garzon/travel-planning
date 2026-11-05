import { z } from "zod";
import { errorResponse, localeOf } from "@/app/_composition/api-errors";
import { getCurrentUser } from "@/modules/auth";
import { deleteTrip, getTrip, tripInputSchema, updateTrip } from "@/modules/trips";

const patchSchema = tripInputSchema.extend({ version: z.number().int().positive() });

type Context = { params: Promise<{ tripId: string }> };

export async function GET(request: Request, { params }: Context) {
  const currentUser = await getCurrentUser();
  if (currentUser === null) {
    return await errorResponse(request, "UNAUTHENTICATED");
  }

  const { tripId } = await params;
  const result = await getTrip({ userId: currentUser.id, tripId, locale: localeOf(request) });

  return result.ok ? Response.json(result.value) : await errorResponse(request, result.error.code);
}

export async function PATCH(request: Request, { params }: Context) {
  const currentUser = await getCurrentUser();
  if (currentUser === null) {
    return await errorResponse(request, "UNAUTHENTICATED");
  }

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    return await errorResponse(request, "VALIDATION_FAILED", details);
  }

  const { tripId } = await params;
  const { version, ...input } = parsed.data;
  const result = await updateTrip({
    userId: currentUser.id,
    tripId,
    locale: localeOf(request),
    today: new Date().toISOString().slice(0, 10),
    version,
    input,
  });
  if (result.ok) {
    return Response.json(result.value);
  }

  return result.error.code === "ROUTE_INVALID"
    ? await errorResponse(request, "ROUTE_INVALID", result.error.violations)
    : await errorResponse(request, result.error.code);
}

export async function DELETE(request: Request, { params }: Context) {
  const currentUser = await getCurrentUser();
  if (currentUser === null) {
    return await errorResponse(request, "UNAUTHENTICATED");
  }

  const { tripId } = await params;
  const result = await deleteTrip({ userId: currentUser.id, tripId });

  return result.ok
    ? new Response(null, { status: 204 })
    : await errorResponse(request, result.error.code);
}
