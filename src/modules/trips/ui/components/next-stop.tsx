import { ArrowRight, UserPlus } from "lucide-react";
import { useLocale } from "next-intl";
import type { ReactNode } from "react";
import { NextStopCarousel } from "@/modules/trips/ui/components/next-stop-carousel";
import type {
  HomeActivity,
  NextStop,
  NextStopDay,
  NextStopStation,
} from "@/modules/trips/ui/components/next-stop-model";
import { formatTripDateRange } from "@/modules/trips/ui/components/trip-date-range";
import { Link } from "@/shared/i18n/navigation";
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

type MapItem =
  | { kind: "station"; index: number; code: string; name: string }
  | { kind: "gap"; hidden: number; after: number };

const MAX_STATIONS = 5;

/**
 * Long lines keep the ends and the day's neighbours; each folded run
 * becomes one "+N" item, so the current station never drops off.
 */
function mapItems(stations: NextStopStation[], current: number): MapItem[] {
  const keep = new Set([0, stations.length - 1, current - 1, current, current + 1]);
  const visible =
    stations.length <= MAX_STATIONS
      ? stations.map((_, i) => i)
      : stations.map((_, i) => i).filter((i) => keep.has(i));
  const items: MapItem[] = [];
  visible.forEach((index, n) => {
    const prev = visible[n - 1];
    if (prev !== undefined && index - prev > 1) {
      items.push({ kind: "gap", hidden: index - prev - 1, after: prev });
    }
    const station = stations[index] as NextStopStation;
    items.push({ kind: "station", index, code: station.code, name: station.name });
  });
  return items;
}

/**
 * The trip's whole line, with the day's station marked: rode stretches
 * solid, the rest still to ride faint. Codes are decorative; each
 * station is read out by name.
 */
function StationMap({
  stations,
  current,
  hereLabel,
  label,
}: {
  stations: NextStopStation[];
  current: number;
  hereLabel: string;
  label: string;
}) {
  const items = mapItems(stations, current);
  const reached = (item: MapItem | undefined) =>
    item !== undefined && (item.kind === "station" ? item.index <= current : item.after < current);

  return (
    <ol aria-label={label} className="flex items-start">
      {items.map((item, n) => (
        <MapStop
          key={item.kind === "station" ? `s${item.index}` : `g${item.after}`}
          item={item}
          here={item.kind === "station" && item.index === current}
          rodeIn={n > 0 && reached(item)}
          rodeOut={reached(items[n + 1])}
          first={n === 0}
          last={n === items.length - 1}
          hereLabel={hereLabel}
        />
      ))}
    </ol>
  );
}

function Segment({ hidden, rode }: { hidden: boolean; rode: boolean }) {
  return (
    <span
      className={cx(
        "h-1 flex-1 sm:h-1.5",
        hidden ? "invisible" : rode ? "bg-on-accent" : "bg-on-accent/35",
      )}
    />
  );
}

function stationDot(here: boolean, rode: boolean): string {
  if (here) {
    return "size-8 border-4 bg-on-accent ring-4 ring-on-accent/35 motion-safe:animate-station-in";
  }
  return rode ? "size-4 border-3 bg-on-accent" : "size-4 border-3 bg-accent";
}

/** One stop of the map: the line in, the station (or "+N"), the line out, the code. */
function MapStop({
  item,
  here,
  rodeIn,
  rodeOut,
  first,
  last,
  hereLabel,
}: {
  item: MapItem;
  here: boolean;
  rodeIn: boolean;
  rodeOut: boolean;
  first: boolean;
  last: boolean;
  hereLabel: string;
}) {
  const rode = rodeIn || first;
  return (
    <li className="relative flex min-w-0 flex-1 flex-col items-center">
      <span aria-hidden="true" className="relative flex h-8 w-full items-center">
        <Segment hidden={first} rode={rodeIn} />
        {item.kind === "station" ? (
          <span className={cx("shrink-0 rounded-full border-on-accent", stationDot(here, rode))} />
        ) : (
          <span className="shrink-0 px-1 font-display text-base font-bold leading-none">
            +{item.hidden}
          </span>
        )}
        <Segment hidden={last} rode={rodeOut} />
      </span>
      {item.kind === "station" ? (
        <span className="mt-2 max-w-full truncate px-0.5 font-display text-base font-bold uppercase leading-none tracking-wide sm:text-xl">
          <span aria-hidden="true">{item.code}</span>
          <span className="sr-only">
            {item.name}
            {here && `, ${hereLabel}`}
          </span>
        </span>
      ) : (
        <span className="sr-only">+{item.hidden}</span>
      )}
    </li>
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
function DayLine({ day, tripId }: { day: NextStopDay; tripId: string }) {
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
          <Link
            href={`/trips/${tripId}`}
            className="mt-2 inline-block font-semibold text-accent underline underline-offset-4 ui-hover:text-accent-hover"
          >
            {translate({ translateId: "trips.home.nextStop.planDay" })}
          </Link>
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

/** One board field: a small label over its value. */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-sm font-semibold uppercase">{label}</dt>
      <dd className="mt-1 whitespace-nowrap font-display text-xl font-bold uppercase leading-none tracking-wide">
        {children}
      </dd>
    </div>
  );
}

const DAY_MS = 86_400_000;

function dayDiff(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);
}

/**
 * One day of the next trip as a station board. The line-coloured head
 * names the trip, places the day on its whole line ("you are here"),
 * signs the city at hero scale and gives the day's facts (date,
 * countdown, crew). The body is the day's plan. The trip name is the
 * link to the trip; the foot carries the actions, so nothing nests.
 */
function DayBoard({
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
  const solo = stop.crewCount === 1;

  return (
    <Panel className="flex flex-col border-accent! lg:flex-row">
      <div className="@container flex min-w-0 flex-col gap-5 rounded-t-sm bg-accent p-5 text-on-accent sm:gap-6 sm:p-8 lg:w-5/12 lg:rounded-tr-none lg:rounded-l-sm lg:p-10">
        <h2 id={headingId} className="text-2xl leading-none text-on-accent sm:text-3xl">
          <Link
            href={`/trips/${stop.tripId}`}
            className="group/trip wrap-anywhere underline-offset-6 ui-hover:underline ui-focus:outline-2 ui-focus:outline-solid ui-focus:outline-on-accent ui-focus:outline-offset-4"
          >
            {stop.tripName}
            <ArrowRight
              aria-hidden="true"
              className="ml-2 inline size-6 align-glyph transition-transform duration-fast ease-out motion-safe:group-hover/trip:translate-x-1"
            />
          </Link>
        </h2>

        <p className="-mt-3 font-semibold tabular-nums sm:-mt-4">
          {formatTripDateRange(stop, locale)}
        </p>

        <StationMap
          stations={stop.stations}
          current={day.station}
          label={translate({ translateId: "trips.home.nextStop.line" })}
          hereLabel={translate({
            translateId: today ? "trips.home.nextStop.here" : "trips.home.nextStop.nextHere",
          })}
        />

        <div>
          {day.travel !== null && (
            <p className="text-lg font-semibold">
              {translate({
                translateId: "trips.home.nextStop.from",
                values: { city: day.travel.from },
              })}
            </p>
          )}
          <p
            className={cx(
              "text-hero-fit font-display font-bold uppercase leading-none tracking-wide wrap-break-word motion-safe:animate-sign-in",
              heroFit(day.city),
            )}
          >
            {day.city}
          </p>
        </div>

        <dl className="flex flex-wrap gap-x-6 gap-y-3">
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
            {solo ? translate({ translateId: "trips.home.nextStop.crewSolo" }) : stop.crewCount}
          </Field>
        </dl>
        {solo && (
          <Link
            href={`/trips/${stop.tripId}?invite=1`}
            className="inline-flex items-center gap-2 self-start font-semibold underline underline-offset-4 ui-hover:decoration-2 ui-focus:outline-2 ui-focus:outline-solid ui-focus:outline-on-accent ui-focus:outline-offset-4"
          >
            <UserPlus aria-hidden="true" className="size-5" />
            {translate({ translateId: "trips.home.nextStop.invite" })}
          </Link>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-8 lg:p-10">
        <h3 className="mb-4 text-xl sm:mb-6 sm:text-2xl">
          {day.activities.length === 0
            ? translate({ translateId: "trips.home.nextStop.dayPlan" })
            : translate({
                translateId: "trips.home.nextStop.plans",
                values: { count: day.activities.length },
              })}
        </h3>
        <DayLine day={day} tripId={stop.tripId} />
        {first && stop.later.length > 0 && (
          <div className="max-lg:hidden">
            <LaterDays days={stop.later} locale={locale} />
          </div>
        )}
      </div>
    </Panel>
  );
}

/**
 * Home's spotlight: the next day of the next trip, as a station
 * board. On phones the later days stack under it as more boards to
 * swipe through (never past days). From lg the later days list
 * inside the first board.
 */
export function NextStopPanel({ stop }: { stop: NextStop }) {
  const translate = useTranslatable();
  const days = [stop.focus, ...stop.later];

  return (
    <section
      aria-label={translate({ translateId: "trips.home.nextTripHeading" })}
      className="mb-6 sm:mb-10"
    >
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
          <DayBoard
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
