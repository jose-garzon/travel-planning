import { useLocale } from "next-intl";
import { daysBetween } from "@/modules/trips/domain/current-stop";
import type { Hub, Stop } from "@/modules/trips/domain/route-view";
import { useTranslatable } from "@/shared/ui/translatable";

/** Short day label ("Mar 3") for a `YYYY-MM-DD` date, in the member's locale. */
function useDayLabel(): (date: string) => string {
  const locale = useLocale();

  return (date) =>
    new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone: "UTC" }).format(
      new Date(`${date}T00:00:00Z`),
    );
}

const CHIP = "mt-1 inline-block rounded-full px-3 py-1 text-sm font-semibold";

type StopStationProps = { stop: Stop; today: string; isCurrent: boolean };

/**
 * Meta of one stop: city, position, arrival (prominent), departure,
 * nights, and on the current stop the countdown. The station name
 * (the code) is set by the line.
 */
export function StopStation({ stop, today, isCurrent }: StopStationProps) {
  const translate = useTranslatable();
  const dayLabel = useDayLabel();
  const untilArrival = stop.arrive === null ? null : daysBetween({ from: today, to: stop.arrive });

  return (
    <>
      <span className="block text-base font-semibold text-text">{stop.name}</span>
      <span className="block">
        {translate({
          translateId: "trips.cards.stopOf",
          values: { number: stop.number, total: stop.total },
        })}
      </span>
      <span className="block font-semibold text-text">
        {stop.arrive === null
          ? translate({ translateId: "trips.cards.dateTbd" })
          : translate({
              translateId: "trips.cards.arrive",
              values: { date: dayLabel(stop.arrive) },
            })}
      </span>
      {stop.depart !== null && (
        <span className="block">
          {translate({ translateId: "trips.cards.leave", values: { date: dayLabel(stop.depart) } })}
        </span>
      )}
      {stop.nights !== null && (
        <span className="block">
          {translate({ translateId: "trips.cards.nights", values: { count: stop.nights } })}
        </span>
      )}
      {isCurrent && (
        <span data-current-stop className={`${CHIP} bg-secondary text-on-secondary`}>
          {translate({ translateId: "trips.cards.current" })}
        </span>
      )}
      {isCurrent && untilArrival !== null && untilArrival >= 0 && (
        <span className={`${CHIP} ml-2 bg-sun text-on-sun`}>
          {translate({ translateId: "trips.cards.stopCountdown", values: { days: untilArrival } })}
        </span>
      )}
    </>
  );
}

type HubStationProps = {
  hub: Hub;
  today: string;
  kind: "takeoff" | "backHome";
  end: string | null;
};

/** Meta of the takeoff (countdown to the trip) or back-home station (countdown to its end). */
export function HubStation({ hub, today, kind, end }: HubStationProps) {
  const translate = useTranslatable();
  const dayLabel = useDayLabel();
  const isTakeoff = kind === "takeoff";
  const dateKey = isTakeoff ? "trips.cards.leaves" : "trips.cards.returns";
  const daysToStart = hub.date === null ? null : daysBetween({ from: today, to: hub.date });
  const daysToEnd = end === null ? null : daysBetween({ from: today, to: end });

  let countdown: string | null = null;
  if (isTakeoff && daysToStart !== null) {
    countdown =
      daysToStart >= 0
        ? translate({ translateId: "trips.cards.takeoffCountdown", values: { days: daysToStart } })
        : daysToEnd !== null && daysToEnd < 0
          ? null
          : translate({ translateId: "trips.cards.onTheWay" });
  } else if (!isTakeoff && daysToEnd !== null && daysToEnd >= 0) {
    countdown = translate({ translateId: "trips.cards.tripEnds", values: { days: daysToEnd } });
  }

  return (
    <>
      <span className="block text-base font-semibold text-text">{hub.name}</span>
      <span className="block font-semibold text-text">
        {hub.date === null
          ? translate({ translateId: "trips.cards.dateTbd" })
          : translate({ translateId: dateKey, values: { date: dayLabel(hub.date) } })}
      </span>
      {countdown !== null && <span className={`${CHIP} bg-sun text-on-sun`}>{countdown}</span>}
    </>
  );
}
