import { useLocale } from "next-intl";
import type { TripDto } from "@/modules/trips/service/schemas";
import { Link } from "@/shared/i18n/navigation";
import { Panel } from "@/shared/ui/components/panel";
import { cx } from "@/shared/ui/cx";
import { useTranslatable } from "@/shared/ui/translatable";

type CompactTripProps = { trip: TripDto; today: string };

const LINK_CLASSES =
  "transition duration-fast ease-out ui-hover:border-accent ui-focus:border-accent " +
  "ui-focus:outline-2 ui-focus:outline-solid ui-focus:outline-focus ui-focus:outline-offset-4";

/** Other trips: name, the first leg's codes (LIM → CUZ) and its date; links to the trip. */
export function CompactTrip({ trip, today }: CompactTripProps) {
  const translate = useTranslatable();
  const locale = useLocale();
  const [first] = trip.legs;
  const isPast = trip.endDate !== null && trip.endDate < today;
  const day = (date: string) =>
    new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone: "UTC" }).format(
      new Date(`${date}T00:00:00Z`),
    );

  return (
    <Panel
      as={Link}
      href={`/trips/${trip.id}`}
      className={cx(
        LINK_CLASSES,
        "flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 p-5",
        isPast && "border-border-strong! text-text-muted",
      )}
    >
      <p className="min-w-0 font-display text-2xl font-bold uppercase leading-none tracking-wide wrap-anywhere">
        {trip.name}
      </p>
      {first !== undefined && (
        <p className="font-display text-lg font-bold uppercase tracking-wide">
          {`${first.from.code} → ${first.to.code}`}
        </p>
      )}
      <p className="text-sm tabular-nums">
        {isPast && trip.endDate !== null
          ? translate({ translateId: "trips.home.ended", values: { date: day(trip.endDate) } })
          : first?.date != null
            ? day(first.date)
            : translate({ translateId: "trips.home.noDates" })}
      </p>
    </Panel>
  );
}
