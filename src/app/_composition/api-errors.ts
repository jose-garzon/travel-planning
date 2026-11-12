import { getTranslations } from "next-intl/server";
import type { Locale } from "@/shared/i18n/routing";

/** Every `error.code` the API answers (plan "Contracts"), with its HTTP status. */
export type ApiErrorCode =
  | "VALIDATION_FAILED"
  | "ROUTE_INVALID"
  | "UNAUTHENTICATED"
  | "TRIP_NOT_FOUND"
  | "TRIP_FORBIDDEN"
  | "TRIP_VERSION_CONFLICT"
  | "MEMBER_NOT_FOUND"
  | "OWNER_CANNOT_LEAVE"
  | "INVITE_EXPIRED"
  | "TRIP_FULL"
  | "ACTIVITY_NOT_FOUND"
  | "ACTIVITY_OUTSIDE_TRIP"
  | "TOO_MANY_ACTIVITIES"
  | "BUDGET_ITEM_NOT_FOUND"
  | "TRANSFER_NOT_FOUND"
  | "TRANSFER_ARRIVAL_BEFORE"
  | "TRANSFER_NOT_OPT_IN"
  | "TRANSFER_VERSION_CONFLICT"
  | "TOO_MANY_TRANSFERS"
  | "AGENT_RATE_LIMITED"
  | "AGENT_UNAVAILABLE";

const STATUS: Record<ApiErrorCode, number> = {
  VALIDATION_FAILED: 400,
  ROUTE_INVALID: 400,
  UNAUTHENTICATED: 401,
  TRIP_NOT_FOUND: 404,
  TRIP_FORBIDDEN: 403,
  TRIP_VERSION_CONFLICT: 409,
  MEMBER_NOT_FOUND: 404,
  OWNER_CANNOT_LEAVE: 403,
  INVITE_EXPIRED: 410,
  TRIP_FULL: 409,
  ACTIVITY_NOT_FOUND: 404,
  ACTIVITY_OUTSIDE_TRIP: 400,
  TOO_MANY_ACTIVITIES: 409,
  BUDGET_ITEM_NOT_FOUND: 404,
  TRANSFER_NOT_FOUND: 404,
  TRANSFER_ARRIVAL_BEFORE: 400,
  TRANSFER_NOT_OPT_IN: 400,
  TRANSFER_VERSION_CONFLICT: 409,
  TOO_MANY_TRANSFERS: 409,
  AGENT_RATE_LIMITED: 429,
  AGENT_UNAVAILABLE: 503,
};

/** `{ error: { code, message, details? } }` with the status for `code`; the message is in the request locale. */
export async function errorResponse(request: Request, code: ApiErrorCode, details?: unknown) {
  const t = await getTranslations({ locale: localeOf(request), namespace: "trips.errors" });

  return Response.json({ error: { code, message: t(code), details } }, { status: STATUS[code] });
}

/** `Accept-Language` matched to `en`/`es` (plan "Contracts"); `en` otherwise. */
export function localeOf(request: Request): Locale {
  const header = request.headers.get("accept-language") ?? "";

  return header.toLowerCase().startsWith("es") ? "es" : "en";
}

/** Parses a JSON body with `schema`; on failure, the `VALIDATION_FAILED` response. */
export async function parseBody<T>(
  request: Request,
  schema: {
    safeParse(
      data: unknown,
    ):
      | { success: true; data: T }
      | { success: false; error: { issues: { path: PropertyKey[]; message: string }[] } };
  },
): Promise<{ ok: true; data: T } | { ok: false; response: Response }> {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (parsed.success) {
    return { ok: true, data: parsed.data };
  }
  const details = parsed.error.issues.map((issue) => ({
    field: issue.path.map(String).join("."),
    message: issue.message,
  }));
  return { ok: false, response: await errorResponse(request, "VALIDATION_FAILED", details) };
}
