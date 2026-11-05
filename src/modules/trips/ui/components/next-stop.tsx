import { useLocale } from "next-intl";
import type { ReactNode } from "react";
import { NextStopCarousel } from "@/modules/trips/ui/components/next-stop-carousel";
import type {
  HomeActivity,
  NextStop,
  NextStopDay,
} from "@/modules/trips/ui/components/next-stop-model";
import { Link } from "@/shared/i18n/navigation";
import { buttonClasses } from "@/shared/ui/components/button-classes";
import { Panel } from "@/shared/ui/components/panel";
import { cx } from "@/shared/ui/cx";
import { useTranslatable } from "@/shared/ui/translatable";

const HEADING_ID = "next-stop-heading";

function formatDay(date: string, locale: string, weekday: "long" | "short"): string {
  return new Intl.DateTimeFormat(locale, {
    weekday,
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

/** "2 h", "45 min", "1 h 30 min", in the locale's units. */
function formatDuration(minutes: number, locale: string): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const unit = (value: number, name: "hour" | "minute") =>
    new Intl.NumberFormat(locale, { style: "unit", unit: name, unitDisplay: "short" }).format(
      value,
    );
  if (hours === 0) {
    return unit(rest, "minute");
  }
  return rest === 0 ? unit(hours, "hour") : `${unit(hours, "hour")} ${unit(rest, "minute")}`;
}

/**
 * The travel into the day's city as a short stretch of line in the
 * on-line colour: origin code, the line, a filled ring, the city code.
 */
function TravelStrip({
  fromCode,
  toCode,
  label,
}: {
  fromCode: string;
  toCode: string;
  label: string;
}) {
  return (
    <p className="flex items-center gap-3 font-display text-lg font-bold sm:text-2xl uppercase leading-none tracking-wide">
      <span className="sr-only">{label}</span>
      <span aria-hidden="true">{fromCode}</span>
      <span aria-hidden="true" className="flex flex-1 items-center">
        <span className="h-1 flex-1 origin-left sm:h-2 bg-on-accent motion-safe:animate-line-across" />
        <span className="size-4 shrink-0 rounded-full border-3 sm:size-6 sm:border-4 border-on-accent bg-accent" />
      </span>
      <span aria-hidden="true">{toCode}</span>
    </p>
  );
}

function ActivityMeta({ activity, locale }: { activity: HomeActivity; locale: string }) {
  const translate = useTranslatable();
  const time =
    activity.startTime === null
      ? translate({ translateId: "trips.home.nextStop.anyTime" })
      : activity.durationMinutes === null
        ? activity.startTime
        : `${activity.startTime} · ${formatDuration(activity.durationMinutes, locale)}`;

  return (
    <span className="mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold">
      <span className="rounded-full bg-sun px-3 py-1 leading-none tabular-nums text-on-sun">
        {time}
      </span>
      {activity.subscribed ? (
        <span className="rounded-full bg-secondary px-3 py-1 leading-none text-on-secondary">
          {translate({ translateId: "trips.home.nextStop.youreIn" })}
        </span>
      ) : (
        <span className="text-text-muted">
          {translate({
            translateId: "trips.home.nextStop.going",
            values: { count: activity.goingCount },
          })}
        </span>
      )}
    </span>
  );
}

/** The day's plan on its own short line: travel first, then each activity. */
function DayLine({ day }: { day: NextStopDay }) {
  const translate = useTranslatable();
  const locale = useLocale();

  return (
    <ol aria-label={translate({ translateId: "trips.home.nextStop.dayPlan" })} className="route">
      {day.travel !== null && (
        <li className="route-stop route-stop-hub wipe-in meter-row">
          <span className="block font-display text-xl font-bold sm:text-2xl uppercase leading-none tracking-wide wrap-anywhere">
            {translate({
              translateId: "trips.home.nextStop.arrive",
              values: { city: day.city },
            })}
          </span>
          <span className="mt-1 block text-sm text-text-muted">
            {translate({
              translateId: "trips.home.nextStop.from",
              values: { city: day.travel.from },
            })}
          </span>
        </li>
      )}
      {day.activities.map((activity) => (
        <li
          key={activity.id}
          className={cx("route-stop wipe-in meter-row", activity.subscribed && "route-stop-hub")}
        >
          <span className="block font-display text-xl font-bold sm:text-2xl uppercase leading-none tracking-wide wrap-anywhere">
            {activity.title}
          </span>
          <ActivityMeta activity={activity} locale={locale} />
        </li>
      ))}
      {day.activities.length === 0 && (
        <li className="route-stop route-stop-open wipe-in meter-row">
          <span className="block font-display text-xl font-bold sm:text-2xl uppercase leading-none tracking-wide">
            {translate({
              translateId: "trips.home.nextStop.nothingYet",
              values: { city: day.city },
            })}
          </span>
          <span className="mt-2 block font-semibold text-accent underline underline-offset-4">
            {translate({ translateId: "trips.home.nextStop.planDay" })}
          </span>
        </li>
      )}
    </ol>
  );
}

function LaterDays({ days, locale }: { days: NextStopDay[]; locale: string }) {
  const translate = useTranslatable();

  return (
    <div className="mt-6 border-t-2 border-border pt-5 sm:mt-8 sm:pt-6">
      <h4 className="mb-3 text-lg sm:mb-4 sm:text-xl">
        {translate({ translateId: "trips.home.nextStop.later" })}
      </h4>
      <ul className="-mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0">
        {days.map((day) => (
          <li
            key={day.date}
            className="w-full max-w-nav shrink-0 snap-start rounded-md bg-surface-2 p-3 sm:w-auto sm:max-w-none sm:min-w-0 sm:bg-transparent sm:p-0"
          >
            <span className="inline-block rounded-full bg-sun px-3 py-1 text-sm font-semibold text-on-sun">
              {formatDay(day.date, locale, "short")}
            </span>
            <p className="mt-2 font-display text-xl font-bold uppercase leading-none tracking-wide wrap-anywhere">
              {day.city}
            </p>
            <p className="mt-1 truncate text-sm text-text-muted">
              {translate({
                translateId: "trips.home.nextStop.plans",
                values: { count: day.activities.length },
              })}
              {": "}
              {day.activities.map((activity) => activity.title).join(", ")}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** One ticket field: a small label over its value. */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase">{label}</dt>
      <dd className="mt-1 whitespace-nowrap font-display text-xl font-bold uppercase leading-none tracking-wide">
        {children}
      </dd>
    </div>
  );
}

/** Short, stable ticket number from the trip id ("4F2A-9C1E"). */
function ticketCode(tripId: string): string {
  const hex = tripId.replace(/[^0-9a-f]/gi, "").toUpperCase();
  return `${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
}

const DAY_MS = 86_400_000;

function dayDiff(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);
}

/**
 * One day as a train ticket. The magenta stub carries the route, the
 * city at hero scale and the fare fields (date, departure, crew); a
 * perforated tear with punched notches parts it from the day's plan; a
 * barcode foot closes it. The whole ticket is one link to the trip.
 * The first one also lists the later days (from lg; phones swipe).
 */
function DayTicket({
  stop,
  day,
  headingId,
  first,
}: {
  stop: NextStop;
  day: NextStopDay;
  headingId: string;
  first: boolean;
}) {
  const translate = useTranslatable();
  const locale = useLocale();
  const today = first && stop.underway;
  const daysAway = stop.daysAway + dayDiff(stop.focus.date, day.date);
  const when = today
    ? translate({ translateId: "trips.home.nextStop.today" })
    : translate({ translateId: "trips.home.countdown", values: { days: daysAway } });

  return (
    <Panel
      as={Link}
      href={`/trips/${stop.tripId}`}
      aria-describedby={`${headingId}-day`}
      className={cx(
        "group flex min-h-ticket flex-col border-accent! lg:flex-row",
        "transition duration-fast ease-out motion-safe:active:scale-99",
        "ui-focus:outline-2 ui-focus:outline-solid ui-focus:outline-focus ui-focus:outline-offset-4",
      )}
    >
      <div className="@container flex min-w-0 flex-col gap-6 rounded-t-sm bg-accent p-5 text-on-accent sm:p-8 lg:w-5/12 lg:justify-between lg:rounded-tr-none lg:rounded-l-sm lg:p-10">
        {day.travel !== null ? (
          <TravelStrip
            fromCode={day.travel.fromCode}
            toCode={day.cityCode}
            label={translate({
              translateId: "trips.home.routeName",
              values: { route: `${day.travel.from} → ${day.city}` },
            })}
          />
        ) : (
          <p className="font-display text-lg font-bold uppercase leading-none tracking-wide wrap-anywhere sm:text-2xl">
            {stop.tripName}
          </p>
        )}

        <h2
          id={headingId}
          className={cx(
            "text-hero-fit leading-none text-on-accent wrap-break-word motion-safe:animate-sign-in",
            heroFit(day.city),
          )}
        >
          {day.city}
        </h2>

        <dl id={`${headingId}-day`} className="flex flex-wrap gap-x-6 gap-y-3">
          <Field label={translate({ translateId: "trips.home.nextStop.fieldDate" })}>
            {formatDay(day.date, locale, "short")}
          </Field>
          <Field
            label={translate({
              translateId: today ? "trips.home.nextStop.fieldNow" : "trips.home.nextStop.fieldWhen",
            })}
          >
            {when}
          </Field>
          <Field label={translate({ translateId: "trips.home.nextStop.fieldCrew" })}>
            {stop.crewCount}
          </Field>
        </dl>
      </div>

      <div aria-hidden="true" className="ticket-tear" />

      <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-8 lg:p-10">
        <h3 className="mb-4 text-xl sm:mb-6 sm:text-2xl">
          {day.activities.length === 0
            ? translate({ translateId: "trips.home.nextStop.dayPlan" })
            : translate({
                translateId: "trips.home.nextStop.plans",
                values: { count: day.activities.length },
              })}
        </h3>
        <DayLine day={day} />
        {first && stop.later.length > 0 && (
          <div className="max-lg:hidden">
            <LaterDays days={stop.later} locale={locale} />
          </div>
        )}

        <div className="mt-auto flex items-end gap-4 pt-6">
          <div className="min-w-0 flex-1 text-text-muted">
            <div aria-hidden="true" className="ticket-barcode" />
            <p className="mt-1 text-xs font-semibold">
              {translate({
                translateId: "trips.home.nextStop.ticketNo",
                values: { code: ticketCode(stop.tripId) },
              })}
              {" · "}
              {stop.tripName}
            </p>
          </div>
          <span
            aria-hidden="true"
            className={cx(
              buttonClasses({ variant: "primary" }),
              "max-lg:hidden group-hover:bg-accent-hover group-hover:text-on-accent",
            )}
          >
            {translate({ translateId: "trips.home.nextStop.openTrip" })}
          </span>
        </div>
      </div>
    </Panel>
  );
}

/**
 * Home's spotlight: the next day of the next trip, as a ticket. On
 * phones it fills the screen under the greeting, and the later days
 * stack under it as more tickets to swipe through (never past days).
 * From lg the later days list inside the first ticket.
 */
export function NextStopPanel({ stop }: { stop: NextStop }) {
  const translate = useTranslatable();
  const days = [stop.focus, ...stop.later];

  return (
    <section aria-labelledby={HEADING_ID} className="mb-6 sm:mb-10">
      <NextStopCarousel
        label={translate({ translateId: "trips.home.nextStop.carousel" })}
        backLabel={translate({ translateId: "trips.home.nextStop.backToFirst" })}
        positionLabels={days.map((_, i) =>
          translate({
            translateId: "trips.home.nextStop.position",
            values: { n: i + 1, total: days.length },
          }),
        )}
        slides={days.map((day, i) => (
          <DayTicket
            key={day.date}
            stop={stop}
            day={day}
            first={i === 0}
            headingId={i === 0 ? HEADING_ID : `${HEADING_ID}-${day.date}`}
          />
        ))}
      />
    </section>
  );
}

/** Longest word, in letters, as `--fit` for `text-hero-fit` (tokens.css). */
const FIT = [
  "[--fit:6]",
  "[--fit:7]",
  "[--fit:8]",
  "[--fit:9]",
  "[--fit:10]",
  "[--fit:11]",
  "[--fit:12]",
];
function heroFit(city: string): string {
  const longest = Math.max(...city.split(/\s+/).map((word) => word.length), 1);
  return FIT[Math.min(Math.max(longest, 6), 12) - 6] ?? "[--fit:6]";
}
