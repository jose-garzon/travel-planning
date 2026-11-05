import { Pencil } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Link } from "@/shared/i18n/navigation";
import { buttonClasses } from "@/shared/ui/components/button-classes";
import { Icon } from "@/shared/ui/components/icon";
import { Panel } from "@/shared/ui/components/panel";
import { Tooltip } from "@/shared/ui/components/tooltip";
import { cx } from "@/shared/ui/cx";
import { trainPosition } from "./train-position";

type TripSummaryProps = {
  tripId: string;
  name: string;
  /** Origin then each destination, in route order. */
  routeNames: string[];
  /** Station code of each route city (the city's own code), same order. */
  routeCodes: string[];
  startDate: string | null;
  endDate: string | null;
  crewCount: number;
  /** Formatted money: the viewer's share and the trip total. */
  myShare: string;
  total: string;
  /** Under the share while it is still empty: how it fills up. */
  shareHint?: string;
  /** Extra actions beside Edit (the owner's Share on phones). */
  actions?: ReactNode;
  /** Day of each leg, in route order; places the train on the line. */
  legDates: string[];
  /** Today, as an ISO date. */
  today: string;
};

/**
 * Literal classes for the train's place on a segment, in 5% steps, so
 * Tailwind sees each one (no inline styles).
 */
const ALONG = [
  "[--t:0]",
  "[--t:0.05]",
  "[--t:0.1]",
  "[--t:0.15]",
  "[--t:0.2]",
  "[--t:0.25]",
  "[--t:0.3]",
  "[--t:0.35]",
  "[--t:0.4]",
  "[--t:0.45]",
  "[--t:0.5]",
  "[--t:0.55]",
  "[--t:0.6]",
  "[--t:0.65]",
  "[--t:0.7]",
  "[--t:0.75]",
  "[--t:0.8]",
  "[--t:0.85]",
  "[--t:0.9]",
  "[--t:0.95]",
  "[--t:1]",
] as const;

function along(t: number): string {
  return ALONG[Math.round(Math.min(1, Math.max(0, t)) * 20)] ?? ALONG[0];
}

/** One pass field: a small label over its value. */
function Field({
  label,
  children,
  note,
  phone = true,
}: {
  label: string;
  children: ReactNode;
  /** A quiet line under the value. */
  note?: string;
  /** Off: the field only shows from sm up (phones keep dates and share). */
  phone?: boolean;
}) {
  return (
    <div className={cx("min-w-0", !phone && "max-sm:hidden")}>
      <dt className="font-semibold text-text-muted text-xs uppercase">{label}</dt>
      <dd className="mt-1 whitespace-nowrap font-bold font-display text-2xl uppercase leading-none tabular-nums tracking-wide">
        {children}
      </dd>
      {note === undefined ? null : <dd className="mt-1 text-sm text-text-muted">{note}</dd>}
    </div>
  );
}

/**
 * The trip as a route pass. Home's ticket is today (a magenta slab);
 * this is the whole line: ink on paper, a magenta rail on top with
 * every station code and the train on it, the trip name, then the fare
 * fields. Phones keep only dates and the viewer's share; the station
 * board beside it shows from sm up. Edit and share are icon buttons.
 */
export function TripSummary({
  tripId,
  name,
  routeNames,
  routeCodes,
  startDate,
  endDate,
  crewCount,
  myShare,
  total,
  shareHint,
  actions,
  legDates,
  today,
}: TripSummaryProps) {
  const t = useTranslations("trips.edit");
  const locale = useLocale();
  const dayFormat = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  const formatDay = (iso: string) => dayFormat.format(new Date(`${iso}T00:00:00Z`));
  let dates = t("noDates");
  if (startDate !== null) {
    dates =
      endDate === null || endDate === startDate
        ? formatDay(startDate)
        : `${formatDay(startDate)} – ${formatDay(endDate)}`;
  }
  const train = trainPosition(legDates, endDate, today);

  return (
    <header className="[view-timeline-name:--ticket]">
      <Panel className="overflow-hidden border-2 border-text! bg-surface-1">
        <div aria-hidden="true" className="h-2 bg-accent" />
        <div className="flex flex-col gap-6 p-5 sm:flex-row sm:p-8">
          <div className="flex min-w-0 flex-1 flex-col gap-5">
            {routeNames.length > 1 ? (
              <RouteRail
                routeCodes={routeCodes}
                trainAt={train?.overall ?? null}
                trainStation={train?.station ?? null}
              />
            ) : null}
            <div className="flex items-start justify-between gap-3">
              <h1 className="min-w-0 hyphens-auto text-balance break-words text-4xl leading-none sm:text-5xl">
                {name}
              </h1>
              <div className="flex shrink-0 items-center gap-2">
                <Tooltip content={t("editLink")}>
                  <Link
                    href={`/trips/${tripId}/edit`}
                    aria-label={t("editLink")}
                    className={buttonClasses({ variant: "outline", labelHidden: true })}
                  >
                    <Icon icon={Pencil} />
                  </Link>
                </Tooltip>
                {actions}
              </div>
            </div>
            <dl className="flex flex-wrap gap-x-8 gap-y-4">
              <Field label={t("fieldDates")}>{dates}</Field>
              <Field label={t("fieldShare")} note={shareHint}>
                <span className="text-accent">{myShare}</span>
              </Field>

              <Field label={t("fieldCrew")} phone={false}>
                {crewCount}
              </Field>
              <Field label={t("fieldTotal")} phone={false}>
                {total}
              </Field>
            </dl>
          </div>

          {routeNames.length === 0 ? null : (
            <ol aria-label={t("route")} className="sr-only">
              {routeNames.map((city, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: route order is the identity
                <li key={`${index}-${city}`}>
                  {city}
                  {train?.station === index
                    ? ` (${t(train.state === "before" ? "trainBefore" : "trainHere")})`
                    : null}
                </li>
              ))}
            </ol>
          )}
        </div>
      </Panel>
    </header>
  );
}

/**
 * The whole route on one magenta rail across the pass, evenly spaced
 * stations and the amber train at today's place. Codes stay legible:
 * on a crowded line only the ends and the train's station keep theirs
 * (phones from 5 stations, wider screens from 8). Visual only; the
 * sr-only list carries the accessible route.
 */
function RouteRail({
  routeCodes,
  trainAt,
  trainStation,
}: {
  routeCodes: string[];
  trainAt: number | null;
  trainStation: number | null;
}) {
  const last = routeCodes.length - 1;
  const crowdedPhone = routeCodes.length > 4;
  const crowdedWide = routeCodes.length > 7;
  return (
    <div aria-hidden="true" className="relative mx-4 flex h-10 items-end justify-between">
      <span className="rail-line" />
      {routeCodes.map((city, index) => {
        const keep = index === 0 || index === last || index === trainStation;
        return (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: route order is the identity
            key={`${index}-${city}`}
            className="rail-stop"
          >
            <span
              className={cx(
                "font-bold font-display text-sm uppercase leading-none tracking-wide",
                !keep && crowdedPhone && "max-sm:invisible",
                !keep && crowdedWide && "invisible",
              )}
            >
              {city}
            </span>
            <span className="flex size-4 items-center justify-center">
              <span
                className={cx(
                  "shrink-0 rounded-full border-accent bg-surface-1",
                  crowdedPhone ? "size-3 border-2" : "size-4 border-3",
                )}
              />
            </span>
          </span>
        );
      })}
      {trainAt === null ? null : <span className={cx("rail-train", along(trainAt))} />}
    </div>
  );
}

type TicketStripProps = {
  name: string;
  routeCodes: string[];
  myShare: string;
  shareLabel: string;
  legDates: string[];
  endDate: string | null;
  today: string;
};

/**
 * The ticket folded down: a slim magenta strip that slides in at the
 * top once the ticket scrolls away, keeping the route, the train and
 * the viewer's share in sight. Driven by the ticket's view timeline,
 * so it needs no script; browsers without scroll timelines never show
 * it. A visual echo of the header, hidden from assistive tech.
 */
export function TicketStrip({
  name,
  routeCodes,
  myShare,
  shareLabel,
  legDates,
  endDate,
  today,
}: TicketStripProps) {
  const first = routeCodes[0];
  const last = routeCodes.at(-1);
  const train = trainPosition(legDates, endDate, today);
  return (
    <div aria-hidden="true" className="sticky top-0 z-30 -mb-8 h-0">
      <div className="ticket-strip">
        {first !== undefined && last !== undefined && routeCodes.length > 1 ? (
          <span className="flex shrink-0 items-center gap-2 font-bold font-display text-lg uppercase leading-none tracking-wide">
            {first}
            <span className="relative flex w-10 items-center sm:w-20">
              <span className="h-1 flex-1 bg-on-accent" />
              {train === null ? null : (
                <span className={cx("ticket-strip-train", along(train.overall))} />
              )}
            </span>
            {last}
          </span>
        ) : null}
        <span className="min-w-0 flex-1 truncate font-bold font-display text-xl uppercase leading-none tracking-wide">
          {name}
        </span>
        <span className="shrink-0 text-right">
          <span className="block font-semibold text-xs uppercase max-sm:sr-only">{shareLabel}</span>
          <span className="block font-bold font-display text-xl uppercase leading-none tabular-nums tracking-wide">
            {myShare}
          </span>
        </span>
      </div>
    </div>
  );
}
