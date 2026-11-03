import { useLocale } from "next-intl";
import type { TripDto } from "@/modules/trips/service/schemas";
import { Link } from "@/shared/i18n/navigation";
import { Panel } from "@/shared/ui/components/panel";
import { cx } from "@/shared/ui/cx";
import { useTranslatable } from "@/shared/ui/translatable";

type CompactTripProps = { trip: TripDto; isPast?: boolean };

const LINK_CLASSES =
  "transition duration-fast ease-out ui-hover:border-accent ui-focus:border-accent " +
  "ui-focus:outline-2 ui-focus:outline-solid ui-focus:outline-focus ui-focus:outline-offset-4";

/** An other or past trip: name, first leg codes, first leg date. Links to the trip. */
export function CompactTrip({ trip, isPast = false }: CompactTripProps) {
  const translate = useTranslatable();
  const locale = useLocale();
  const [first] = trip.legs;

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
      <span className="font-display text-2xl font-bold uppercase leading-none tracking-wide wrap-anywhere">
        {trip.name}
      </span>
      {first !== undefined && (
        <span className="font-display text-lg font-bold uppercase tracking-wide">
          {translate({
            translateId: "trips.cards.firstLeg",
            values: { from: first.from.code, to: first.to.code },
          })}
        </span>
      )}
      <span className="tabular-nums">
        {first?.date
          ? new Intl.DateTimeFormat(locale, {
              month: "short",
              day: "numeric",
              timeZone: "UTC",
            }).format(new Date(`${first.date}T00:00:00Z`))
          : translate({ translateId: "trips.home.noDates" })}
      </span>
    </Panel>
  );
}
