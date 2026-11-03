import { searchCities } from "@/modules/trips";
import { routing } from "@/shared/i18n/routing";

/** `GET /api/v1/cities?q&locale[&exclude&region]`: up to 8 options, popular ones when `q` is short. */
export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const requested = params.get("locale");
  const locale =
    routing.locales.find((candidate) => candidate === requested) ?? routing.defaultLocale;

  const items = searchCities({
    query: params.get("q") ?? "",
    locale,
    exclude: params.get("exclude") ?? undefined,
    region: params.get("region") ?? undefined,
  });

  return Response.json({ items });
}
