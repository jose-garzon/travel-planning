import { getCurrentUser } from "@/modules/auth";
import { createTrip, listMyTrips, tripInputSchema } from "@/modules/trips";
import type { Locale } from "@/shared/i18n/routing";

type ErrorCode = "VALIDATION_FAILED" | "ROUTE_INVALID" | "UNAUTHENTICATED";

function errorResponse(status: number, code: ErrorCode, message: string, details?: unknown) {
  return Response.json({ error: { code, message, details } }, { status });
}

/** `Accept-Language` matched to `en`/`es` (plan "Contracts"); `en` otherwise. */
function localeOf(request: Request): Locale {
  const header = request.headers.get("accept-language") ?? "";

  return header.toLowerCase().startsWith("es") ? "es" : "en";
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (currentUser === null) {
    return errorResponse(401, "UNAUTHENTICATED", "Sign in to create a trip.");
  }

  const body = await request.json().catch(() => null);
  const parsed = tripInputSchema.safeParse(body);
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    return errorResponse(400, "VALIDATION_FAILED", "The trip is invalid.", details);
  }

  const result = await createTrip({
    userId: currentUser.id,
    locale: localeOf(request),
    today: new Date().toISOString().slice(0, 10),
    input: parsed.data,
  });
  if (!result.ok) {
    return errorResponse(400, "ROUTE_INVALID", "The route is invalid.", result.error);
  }

  return Response.json(result.value, { status: 201 });
}

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();
  if (currentUser === null) {
    return errorResponse(401, "UNAUTHENTICATED", "Sign in to see your trips.");
  }

  const items = await listMyTrips({ userId: currentUser.id, locale: localeOf(request) });

  return Response.json({ items, nextCursor: null });
}
