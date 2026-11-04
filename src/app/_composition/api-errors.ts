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
  | "TRIP_FULL";

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
