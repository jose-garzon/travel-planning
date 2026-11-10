import type { TripDto } from "@/modules/trips/service/schemas";

/**
 * Formats a trip's date range (`YYYY-MM-DD`) with `Intl`, in each
 * locale's own word order (AC-14: "Mar 3 – 10, 2027" in `en`,
 * "3 – 10 mar 2027" in `es`; en dash for ranges). Within one month the day part is widened
 * into a range from `formatToParts`; across months or years the
 * locale's own `formatRange` is used. Undated trips have no range.
 */
export function formatTripDateRange(
  trip: Pick<TripDto, "startDate" | "endDate">,
  locale: string,
): string | null {
  if (trip.startDate === null || trip.endDate === null) {
    return null;
  }
  const start = new Date(`${trip.startDate}T00:00:00Z`);
  const end = new Date(`${trip.endDate}T00:00:00Z`);
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

  if (trip.startDate === trip.endDate) {
    return dateFormatter.format(start);
  }
  if (trip.startDate.slice(0, 7) !== trip.endDate.slice(0, 7)) {
    return dateFormatter.formatRange(start, end);
  }

  const endDay = new Intl.DateTimeFormat(locale, { day: "numeric", timeZone: "UTC" }).format(end);

  return dateFormatter
    .formatToParts(start)
    .map((part) => (part.type === "day" ? `${part.value} – ${endDay}` : part.value))
    .join("");
}
