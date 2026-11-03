import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/modules/auth";
import { createTrip, listMyTrips, tripInputSchema } from "@/modules/trips";
import type { Locale } from "@/shared/i18n/routing";

type ErrorCode = "VALIDATION_FAILED" | "ROUTE_INVALID" | "UNAUTHENTICATED";

const STATUS: Record<ErrorCode, number> = {
  VALIDATION_FAILED: 400,
  ROUTE_INVALID: 400,
  UNAUTHENTICATED: 401,
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

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (currentUser === null) {
    return await errorResponse(request, "UNAUTHENTICATED");
  }

  const body = await request.json().catch(() => null);
  const parsed = tripInputSchema.safeParse(body);
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    return await errorResponse(request, "VALIDATION_FAILED", details);
  }

  const result = await createTrip({
    userId: currentUser.id,
    locale: localeOf(request),
    today: new Date().toISOString().slice(0, 10),
    input: parsed.data,
  });
  if (!result.ok) {
    return await errorResponse(request, "ROUTE_INVALID", result.error);
  }

  return Response.json(result.value, { status: 201 });
}

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();
  if (currentUser === null) {
    return await errorResponse(request, "UNAUTHENTICATED");
  }

  const items = await listMyTrips({ userId: currentUser.id, locale: localeOf(request) });

  return Response.json({ items, nextCursor: null });
}
