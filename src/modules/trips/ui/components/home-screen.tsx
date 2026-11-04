import { useLocale } from "next-intl";
import type { HomeTrips } from "@/modules/trips/service/get-home-trips";
import type { TripDto } from "@/modules/trips/service/schemas";
import { EmptyTripsState } from "@/modules/trips/ui/components/empty-trips-state";
import { NewTripLink } from "@/modules/trips/ui/components/new-trip-link";
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
  /** The trip just created; its toast offers "Invite friends" for it. */
  createdTripId?: string;
  /** Shows the "Trip deleted" toast after a delete. */
  justDeleted?: boolean;
  /** Names the trip in "You left {trip}" after the member leaves it. */
  leftTrip?: string;
  /** Shows "You're no longer in this trip" after a removal (EC-5). */
  justRemoved?: boolean;
};

const DAY_MS = 86_400_000;

// A trip panel is a link: pointing at it turns its rule the line
// colour (DESIGN.md). Colour only, so it needs no motion gate.
const TRIP_LINK_CLASSES =
  "transition duration-fast ease-out ui-hover:border-accent ui-focus:border-accent " +
  "ui-focus:outline-2 ui-focus:outline-solid ui-focus:outline-focus ui-focus:outline-offset-4";

const NEXT_TRIP_HEADING_ID = "next-trip-heading";
const OTHER_TRIPS_HEADING_ID = "other-trips-heading";

/** Whole days from `today` to the trip's start, or null when undated. */
function daysUntil(trip: TripDto, today: string): number | null {
  if (trip.startDate === null) {
    return null;
  }
  const start = Date.parse(`${trip.startDate}T00:00:00Z`);
  return Math.max(0, Math.round((start - Date.parse(`${today}T00:00:00Z`)) / DAY_MS));
}

/** Short day label ("Mar 3") for a leg date, in the member's locale. */
function formatDay(date: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

/** Station codes in order: the origin, then every destination. */
function codesOf(trip: TripDto): { id: string; code: string; hub: boolean }[] {
  const [first] = trip.legs;
  if (first === undefined) {
    return [];
  }
  const last = trip.legs[trip.legs.length - 1];
  const returnsHome = last !== undefined && last.to.name === first.from.name;
  return [
    { id: "origin", code: first.from.code, hub: true },
    ...trip.legs.map((leg, index) => ({
      id: `leg-${index}`,
      code: leg.to.code,
      hub: returnsHome && index === trip.legs.length - 1,
    })),
  ];
}

/**
 * The trip's route as a short line of station codes (BOG ━ CTG ━ SMR).
 * Decorative: the route is read out once, from `label`.
 */
function MiniRoute({ trip, label, isPast }: { trip: TripDto; label: string; isPast: boolean }) {
  const codes = codesOf(trip);

  return (
    <div className="flex min-w-0 items-center">
      <span className="sr-only">{label}</span>
      <span aria-hidden="true" className="flex min-w-0 flex-1 items-center">
        {codes.map((stop, index) => (
          <span key={stop.id} className={cx("flex items-center", index > 0 && "min-w-0 flex-1")}>
            {index > 0 && (
              <span
                className={cx("h-1 min-w-3 flex-1", isPast ? "bg-border-strong" : "bg-accent")}
              />
            )}
            <span className="flex flex-col items-center">
              <span
                className={cx(
                  "size-4 rounded-full border-3 border-text",
                  stop.hub ? (isPast ? "bg-border-strong" : "bg-accent") : "bg-bg",
                )}
              />
            </span>
            <span className="ml-1 font-display text-lg font-bold uppercase leading-none tracking-wide">
              {stop.code}
            </span>
          </span>
        ))}
      </span>
    </div>
  );
}

/** The trip's stops in order: the first origin, then every destination. */
function routeOf(trip: TripDto): string {
  const [first] = trip.legs;
  if (first === undefined) {
    return "";
  }
  return [first.from.name, ...trip.legs.map((leg) => leg.to.name)].join(" → ");
}

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

type TripRowProps = {
  trip: TripDto;
  today: string;
  locale: string;
  isNext?: boolean;
  isNew?: boolean;
};

/**
 * One trip on the home timeline: name, dates, its route as a short
 * line, and its next step. Every trip gets the same row; the next one
 * wears the line colour on its rule, past ones go quiet.
 */
function TripRow({ trip, today, locale, isNext = false, isNew = false }: TripRowProps) {
  const translate = useTranslatable();
  const isPast = trip.endDate !== null && trip.endDate < today;
  const days = isPast ? null : daysUntil(trip, today);
  const range =
    formatTripDateRange(trip, locale) ?? translate({ translateId: "trips.home.noDates" });

  return (
    <Panel
      as={Link}
      href={`/trips/${trip.id}`}
      className={cx(
        TRIP_LINK_CLASSES,
        "grid gap-4 p-5 lg:grid-cols-12 lg:items-center lg:gap-8 lg:p-6",
        isNext && "border-accent!",
        isPast && "border-border-strong! text-text-muted",
        isNew && "motion-safe:animate-fade-in",
      )}
    >
      <div className="min-w-0 lg:col-span-4">
        <p className="font-display text-3xl font-bold uppercase leading-none tracking-wide wrap-anywhere">
          {trip.name}
        </p>
        <p className="mt-1 tabular-nums">{range}</p>
      </div>
      <div className="lg:col-span-5">
        <MiniRoute
          trip={trip}
          isPast={isPast}
          label={translate({
            translateId: "trips.home.routeName",
            values: { route: routeOf(trip) },
          })}
        />
      </div>
      <p className="flex flex-wrap gap-2 text-sm font-semibold lg:col-span-3 lg:justify-end">
        {isPast && trip.endDate !== null && (
          <span>
            {translate({
              translateId: "trips.home.ended",
              values: { date: formatDay(trip.endDate, locale) },
            })}
          </span>
        )}
        {!isPast && days !== null && (
          <span className="rounded-full bg-sun px-3 py-1 text-on-sun">
            {translate({ translateId: "trips.home.countdown", values: { days } })}
          </span>
        )}
        {!isPast && trip.startDate === null && (
          <span className="rounded-full bg-sun px-3 py-1 text-on-sun">
            {translate({ translateId: "trips.home.nextStepDates" })}
          </span>
        )}
        {!isPast && (
          <span className="rounded-full bg-secondary px-3 py-1 text-on-secondary">
            {trip.memberCount === 1
              ? translate({ translateId: "trips.home.solo" })
              : translate({
                  translateId: "trips.home.members",
                  values: { count: trip.memberCount },
                })}
          </span>
        )}
      </p>
    </Panel>
  );
}

/**
 * `/[locale]` for a signed-in member (plan "States": home): a greeting
 * and every trip on one timeline, the next trip first, then the other
 * upcoming ones, then past trips; or the empty state when there are
 * none (plan "Contracts", `nextTrip: null`).
 */
export function HomeScreen({
  displayName,
  summary,
  today,
  justCreated = false,
  createdTripId,
  justDeleted = false,
  leftTrip,
  justRemoved = false,
}: HomeScreenProps) {
  const translate = useTranslatable();
  const locale = useLocale();
  const { nextTrip, otherTrips } = summary;
  const hasNoTrips = nextTrip === null && otherTrips.length === 0;
  const upcoming = otherTrips.filter((trip) => !(trip.endDate !== null && trip.endDate < today));
  const past = otherTrips.filter((trip) => trip.endDate !== null && trip.endDate < today);

  return (
    <main className="mx-auto w-full max-w-page px-6 pt-6 pb-16 lg:pt-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 lg:mb-8">
        <h1 className="text-3xl leading-none text-text lg:text-4xl">
          {translate({ translateId: "trips.home.greeting", values: { name: displayName } })}
        </h1>
        {!hasNoTrips && <NewTripLink />}
      </div>

      {justCreated && (
        <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2">
          <p role="status" className="font-semibold text-success">
            {translate({ translateId: "trips.home.created" })}
          </p>
          {createdTripId !== undefined && (
            <Link
              href={`/trips/${createdTripId}?invite=1`}
              className="font-semibold text-accent underline"
            >
              {translate({ translateId: "trips.home.inviteFriends" })}
            </Link>
          )}
        </div>
      )}

      {justDeleted && (
        <Toast tone="success">{translate({ translateId: "trips.edit.deleted" })}</Toast>
      )}

      {leftTrip && (
        <Toast tone="success">
          {translate({ translateId: "trips.home.left", values: { trip: leftTrip } })}
        </Toast>
      )}

      {justRemoved && (
        <Toast tone="error">{translate({ translateId: "trips.home.removed" })}</Toast>
      )}

      {hasNoTrips && <EmptyTripsState />}

      {nextTrip !== null && (
        <section aria-labelledby={NEXT_TRIP_HEADING_ID} className="mb-4">
          {/* Names the region; each row's trip name is its visible heading. */}
          <h2 id={NEXT_TRIP_HEADING_ID} className="sr-only">
            {translate({ translateId: "trips.home.nextTripHeading" })}
          </h2>
          <TripRow trip={nextTrip} today={today} locale={locale} isNext isNew={justCreated} />
        </section>
      )}

      {otherTrips.length > 0 && (
        <section aria-labelledby={OTHER_TRIPS_HEADING_ID}>
          <h2 id={OTHER_TRIPS_HEADING_ID} className="sr-only">
            {translate({ translateId: "trips.home.otherTripsHeading" })}
          </h2>
          {upcoming.length > 0 && (
            <ul className="flex flex-col gap-4">
              {upcoming.map((trip) => (
                <li key={trip.id}>
                  <TripRow trip={trip} today={today} locale={locale} />
                </li>
              ))}
            </ul>
          )}
          {past.length > 0 && (
            <>
              <h3 className="mt-12 mb-4 text-xl text-text-muted">
                {translate({ translateId: "trips.home.pastHeading" })}
              </h3>
              <ul className="flex flex-col gap-4">
                {past.map((trip) => (
                  <li key={trip.id}>
                    <TripRow trip={trip} today={today} locale={locale} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}
    </main>
  );
}
