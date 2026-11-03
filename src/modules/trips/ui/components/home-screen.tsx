import { useLocale } from "next-intl";
import type { HomeTrips } from "@/modules/trips/service/get-home-trips";
import type { TripDto } from "@/modules/trips/service/schemas";
import { EmptyTripsState } from "@/modules/trips/ui/components/empty-trips-state";
import { NewTripLink } from "@/modules/trips/ui/components/new-trip-link";
import { CompactTrip } from "@/modules/trips/ui/home/compact-trip";
import { TripLine } from "@/modules/trips/ui/home/trip-line";
import { Link } from "@/shared/i18n/navigation";
import { Panel } from "@/shared/ui/components/panel";
import { Toast } from "@/shared/ui/components/toast";
import { cx } from "@/shared/ui/cx";
import { useTranslatable } from "@/shared/ui/translatable";

type HomeScreenProps = {
  displayName: string;
  summary: HomeTrips;
  /** `YYYY-MM-DD` in the member's zone; the countdown counts from it. */
  today: string;
  /** Shows the "Trip created" confirmation after a successful create. */
  justCreated?: boolean;
  /** Shows the "Trip deleted" toast after a successful delete. */
  justDeleted?: boolean;
};

const NEXT_TRIP_HEADING_ID = "next-trip-heading";
const OTHER_TRIPS_HEADING_ID = "other-trips-heading";

/**
 * Formats a trip's date range (`YYYY-MM-DD`) with `Intl`, in each
 * locale's own word order (AC-14: "Mar 3 – 10, 2027" in `en`,
 * "3 – 10 mar 2027" in `es`; en dash for ranges). Within one month the day part is widened
 * into a range from `formatToParts`; across months or years the
 * locale's own `formatRange` is used. Undated trips have no range.
 */
function formatTripDateRange(trip: TripDto, locale: string): string | null {
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

/**
 * `/[locale]` for a signed-in member (plan "States": home): a greeting,
 * the next trip as a line of stops, and the other trips (upcoming, then
 * past) as compact panels; or the empty state when there are none.
 */
export function HomeScreen({
  displayName,
  summary,
  today,
  justCreated = false,
  justDeleted = false,
}: HomeScreenProps) {
  const translate = useTranslatable();
  const locale = useLocale();
  const { nextTrip, otherTrips } = summary;
  const hasNoTrips = nextTrip === null && otherTrips.length === 0;
  const range =
    nextTrip === null
      ? null
      : (formatTripDateRange(nextTrip, locale) ?? translate({ translateId: "trips.home.noDates" }));

  return (
    <main className="mx-auto w-full max-w-page px-6 pt-6 pb-16 lg:pt-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 lg:mb-8">
        <h1 className="text-3xl leading-none text-text lg:text-4xl">
          {translate({ translateId: "trips.home.greeting", values: { name: displayName } })}
        </h1>
        {!hasNoTrips && <NewTripLink />}
      </div>

      {justCreated && (
        <p role="status" className="mb-4 font-semibold text-success">
          {translate({ translateId: "trips.home.created" })}
        </p>
      )}

      {justDeleted && (
        <Toast tone="success">{translate({ translateId: "trips.edit.deleted" })}</Toast>
      )}

      {hasNoTrips && <EmptyTripsState />}

      {nextTrip === null && !hasNoTrips && (
        <p className="mb-6 text-lg text-text-muted">
          {translate({ translateId: "trips.home.noUpcoming" })}
        </p>
      )}

      {nextTrip !== null && (
        <section aria-labelledby={NEXT_TRIP_HEADING_ID} className="mb-8">
          {/* Names the region; the trip name below is its visible heading. */}
          <h2 id={NEXT_TRIP_HEADING_ID} className="sr-only">
            {translate({ translateId: "trips.home.nextTripHeading" })}
          </h2>
          <Panel className={cx("p-5 lg:p-6", justCreated && "motion-safe:animate-fade-in")}>
            <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <p className="min-w-0 font-display text-3xl font-bold uppercase leading-none tracking-wide wrap-anywhere">
                {nextTrip.name}
              </p>
              <p className="tabular-nums">{range}</p>
              <p className="text-sm font-semibold">
                {nextTrip.memberCount === 1
                  ? translate({ translateId: "trips.home.solo" })
                  : translate({
                      translateId: "trips.home.members",
                      values: { count: nextTrip.memberCount },
                    })}
              </p>
            </div>
            <TripLine trip={nextTrip} today={today} />
            <Link
              href={`/trips/${nextTrip.id}`}
              className="mt-6 inline-block font-semibold underline"
            >
              {translate({ translateId: "trips.home.openTrip" })}
            </Link>
          </Panel>
        </section>
      )}

      {otherTrips.length > 0 && (
        <section aria-labelledby={OTHER_TRIPS_HEADING_ID}>
          <h2 id={OTHER_TRIPS_HEADING_ID} className="sr-only">
            {translate({ translateId: "trips.home.otherTripsHeading" })}
          </h2>
          <ul className="flex flex-col gap-4">
            {otherTrips.map((trip) => (
              <li key={trip.id}>
                <CompactTrip trip={trip} today={today} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
