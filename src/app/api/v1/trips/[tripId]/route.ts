import { cookies } from "next/headers";
import { z } from "zod";
import { getCurrentUser } from "@/modules/auth";
import { deleteTrip, getTrip, tripInputSchema, updateTrip } from "@/modules/trips";
import type { Locale } from "@/shared/i18n/routing";
import { TIME_ZONE_COOKIE } from "@/shared/ui/components/time-zone-cookie";

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
  TRIP_FORBIDDEN: 403,
  TRIP_NOT_FOUND: 404,
  TRIP_VERSION_CONFLICT: 409,
};

const MESSAGES: Record<ErrorCode, string> = {
  VALIDATION_FAILED: "The trip is invalid.",
  ROUTE_INVALID: "The route is invalid.",
  UNAUTHENTICATED: "Sign in to manage trips.",
  TRIP_FORBIDDEN: "Only the owner can change this trip.",
  TRIP_NOT_FOUND: "Trip not found.",
  TRIP_VERSION_CONFLICT: "This trip changed. Reload to see the latest.",
};

function errorResponse(code: ErrorCode, details?: unknown) {
  return Response.json(
    { error: { code, message: MESSAGES[code], details } },
    { status: STATUS[code] },
  );
}

/** `Accept-Language` matched to `en`/`es` (plan "Contracts"); `en` otherwise. */
function localeOf(request: Request): Locale {
  const header = request.headers.get("accept-language") ?? "";

  return header.toLowerCase().startsWith("es") ? "es" : "en";
}

/** `YYYY-MM-DD` in the user's zone (the `tz` cookie); UTC when absent or invalid (plan D-5). */
async function todayOf(): Promise<string> {
  const timeZone = (await cookies()).get(TIME_ZONE_COOKIE)?.value;
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

const updateSchema = tripInputSchema.extend({ version: z.number().int().min(1) });

type Context = { params: Promise<{ tripId: string }> };

export async function GET(request: Request, { params }: Context) {
  const currentUser = await getCurrentUser();
  if (currentUser === null) {
    return errorResponse("UNAUTHENTICATED");
  }

  const result = await getTrip({
    tripId: (await params).tripId,
    userId: currentUser.id,
    locale: localeOf(request),
  });

  return result.ok ? Response.json(result.value) : errorResponse(result.error.code);
}

export async function PATCH(request: Request, { params }: Context) {
  const currentUser = await getCurrentUser();
  if (currentUser === null) {
    return errorResponse("UNAUTHENTICATED");
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    return errorResponse("VALIDATION_FAILED", details);
  }

  const { version, ...input } = parsed.data;
  const result = await updateTrip({
    tripId: (await params).tripId,
    userId: currentUser.id,
    locale: localeOf(request),
    today: await todayOf(),
    version,
    input,
  });
  if (result.ok) {
    return Response.json(result.value);
  }

  return result.error.code === "ROUTE_INVALID"
    ? errorResponse("ROUTE_INVALID", result.error.violations)
    : errorResponse(result.error.code);
}

export async function DELETE(_request: Request, { params }: Context) {
  const currentUser = await getCurrentUser();
  if (currentUser === null) {
    return errorResponse("UNAUTHENTICATED");
  }

  const result = await deleteTrip({ tripId: (await params).tripId, userId: currentUser.id });

  return result.ok ? new Response(null, { status: 204 }) : errorResponse(result.error.code);
}
