import { useLocale } from "next-intl";
import type { Trip } from "@/modules/trips/domain/trip";
import type { HomeTripsSummary } from "@/modules/trips/service/get-home-trips-summary";
import { EmptyTripsState } from "@/modules/trips/ui/components/empty-trips-state";
import { Link } from "@/shared/i18n/navigation";
import { Card } from "@/shared/ui/components/card-surface";
import { Text } from "@/shared/ui/components/text";
import { useTranslatable } from "@/shared/ui/translatable";

type HomeScreenProps = {
  displayName: string;
  summary: HomeTripsSummary;
};

const NEXT_TRIP_HEADING_ID = "next-trip-heading";
const OTHER_TRIPS_HEADING_ID = "other-trips-heading";

/**
 * Formats a `Trip`'s date range (plan "Contracts", `YYYY-MM-DD`) with
 * `Intl`, in each locale's own word order (AC-14: "Mar 3 - 10, 2027" in
 * `en`, "3 - 10 mar 2027" in `es`). `formatToParts` gives the month/day/
 * year order and separators for a single date; the day part is then
 * widened into a range. Plain `Intl.DateTimeFormat.formatRange` was not
 * used because its en dash and spacing do not match this product's
 * copy. Trips crossing a month or year boundary are out of scope: D-4's
 * fixture never produces one.
 */
function formatTripDateRange(startDate: string, endDate: string, locale: string): string {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  const endDay = new Intl.DateTimeFormat(locale, { day: "numeric", timeZone: "UTC" }).format(end);

  return dateFormatter
    .formatToParts(start)
    .map((part) => (part.type === "day" ? `${part.value} - ${endDay}` : part.value))
    .join("");
}

/**
 * `/[locale]` for a signed-in member (plan "States": home): a greeting,
 * the next upcoming trip (if any) and the rest of the upcoming trips,
 * or the empty state when there is neither (plan "Contracts",
 * `nextTrip: null`).
 */
export function HomeScreen({ displayName, summary }: HomeScreenProps) {
  const translate = useTranslatable();
  const locale = useLocale();
  const { nextTrip, otherTrips } = summary;
  const hasNoTrips = nextTrip === null && otherTrips.length === 0;

  function dateRangeFor(trip: Trip) {
    return formatTripDateRange(trip.startDate, trip.endDate, locale);
  }

  return (
    <div className="flex min-h-below-header flex-col gap-4 px-6 py-16 lg:flex-row lg:gap-12 lg:px-16 lg:py-16">
      <nav
        aria-label={translate({ translateId: "trips.nav.label" })}
        className="hidden shrink-0 basis-1/3 flex-col gap-2 rounded-lg border border-border bg-surface-2 p-6 lg:flex"
      >
        <Link href="/" aria-current="page" className="font-semibold text-accent">
          {translate({ translateId: "trips.nav.trips" })}
        </Link>
        <Link href="/trips/new" className="text-text">
          {translate({ translateId: "trips.nav.newTrip" })}
        </Link>
      </nav>
      <main className="w-full lg:min-w-0 lg:basis-2/3">
        <h1 className="mb-8 text-3xl text-accent">
          {translate({ translateId: "trips.home.greeting", values: { name: displayName } })}
        </h1>

        {hasNoTrips && <EmptyTripsState />}

        {nextTrip !== null && (
          <section aria-labelledby={NEXT_TRIP_HEADING_ID} className="mb-8">
            <Text
              as="h2"
              id={NEXT_TRIP_HEADING_ID}
              size="lg"
              weight="semibold"
              translateId="trips.home.nextTripHeading"
            />
            <Card heading={nextTrip.name}>
              <Text tone="muted">{dateRangeFor(nextTrip)}</Text>
            </Card>
          </section>
        )}

        {otherTrips.length > 0 && (
          <section aria-labelledby={OTHER_TRIPS_HEADING_ID}>
            <Text
              as="h2"
              id={OTHER_TRIPS_HEADING_ID}
              size="lg"
              weight="semibold"
              translateId="trips.home.otherTripsHeading"
            />
            <ul className="flex flex-col gap-3">
              {otherTrips.map((trip) => (
                <li key={trip.name}>
                  <Card heading={trip.name}>
                    <Text tone="muted">{dateRangeFor(trip)}</Text>
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
