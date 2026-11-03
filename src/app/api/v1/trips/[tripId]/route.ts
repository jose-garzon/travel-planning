import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { getCurrentUser } from "@/modules/auth";
import { deleteTrip, getTrip, tripInputSchema, updateTrip } from "@/modules/trips";
import type { Locale } from "@/shared/i18n/routing";

type ErrorCode =
  | "VALIDATION_FAILED"
  | "ROUTE_INVALID"
  | "UNAUTHENTICATED"
  | "TRIP_NOT_FOUND"
  | "TRIP_FORBIDDEN"
  | "TRIP_VERSION_CONFLICT";

const STATUS: Record<ErrorCode, number> = {
  VALIDATION_FAILED: 400,
  ROUTE_INVALID: 400,
  UNAUTHENTICATED: 401,
  TRIP_NOT_FOUND: 404,
  TRIP_FORBIDDEN: 403,
  TRIP_VERSION_CONFLICT: 409,
};

async function errorResponse(request: Request, code: ErrorCode, details?: unknown) {
  const t = await getTranslations({ locale: localeOf(request), namespace: "trips.errors" });

  return Response.json({ error: { code, message: t(code), details } }, { status: STATUS[code] });
}

/** `Accept-Language` matched to `en`/`es` (plan "Contracts"); `en` otherwise. */
function localeOf(request: Request): Locale {
  const header = request.headers.get("accept-language") ?? "";

  return header.toLowerCase().startsWith("es") ? "es" : "en";
}

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
