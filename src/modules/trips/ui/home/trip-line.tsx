"use client";

import { useLocale } from "next-intl";
import { useEffect, useRef } from "react";
import { currentStopIndex, daysBetween } from "@/modules/trips/domain/current-stop";
import { stopsFromLegs } from "@/modules/trips/domain/route-view";
import type { TripDto } from "@/modules/trips/service/schemas";
import { CurrentChip, StationDetail, stationName } from "@/modules/trips/ui/home/stop-station";
import { RouteLine, type RouteStop } from "@/shared/ui/components/route-line";
import { useTranslatable } from "@/shared/ui/translatable";

type TripLineProps = { trip: TripDto; today: string };

function formatDay(date: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

/**
 * The next trip as a line of stations (DESIGN.md): takeoff, each stop,
 * back home. Vertical on mobile, horizontal from `lg`, where it
 * scrolls sideways (keyboard-focusable) and starts at the current stop.
 */
export function TripLine({ trip, today }: TripLineProps) {
  const translate = useTranslatable();
  const locale = useLocale();
  const scroller = useRef<HTMLDivElement>(null);

  const view = stopsFromLegs(trip.legs);
  const currentIndex = currentStopIndex({ view, today });
  const day = (date: string) => formatDay(date, locale);

  useEffect(() => {
    const box = scroller.current;
    const here = box?.querySelector<HTMLElement>("[aria-current='step']")?.closest("li");
    if (box !== null && here != null && box.scrollWidth > box.clientWidth) {
      box.scrollLeft = here.offsetLeft - box.offsetLeft;
    }
  }, []);

  const stations: RouteStop[] = [];

  if (view.takeoff !== null) {
    const { city, date } = view.takeoff;
    const days = date === null ? null : daysBetween({ from: today, to: date });
    stations.push({
      id: "takeoff",
      variant: "hub",
      name: stationName({ city, label: translate({ translateId: "trips.cards.takeoff" }) }),
      meta: (
        <>
          <StationDetail strong>
            {date === null
              ? translate({ translateId: "trips.cards.dateTbd" })
              : translate({ translateId: "trips.cards.departs", values: { date: day(date) } })}
          </StationDetail>
          {days !== null && (
            <StationDetail>
              {days < 0
                ? translate({ translateId: "trips.cards.onTheWay" })
                : translate({ translateId: "trips.cards.toGo", values: { days } })}
            </StationDetail>
          )}
        </>
      ),
    });
  }

  view.stops.forEach((stop, index) => {
    const current = index === currentIndex;
    const untilArrival =
      current && stop.arrive !== null && stop.arrive >= today
        ? daysBetween({ from: today, to: stop.arrive })
        : null;

    stations.push({
      id: `stop-${index}`,
      name: stationName({ city: stop.city, current }),
      meta: (
        <>
          <StationDetail>
            {translate({
              translateId: "trips.cards.stopOf",
              values: { position: stop.position, total: stop.total },
            })}
          </StationDetail>
          <StationDetail strong>
            {stop.arrive === null
              ? translate({ translateId: "trips.cards.dateTbd" })
              : translate({
                  translateId: "trips.cards.arrive",
                  values: { date: day(stop.arrive) },
                })}
          </StationDetail>
          {stop.depart !== null && (
            <StationDetail>
              {translate({ translateId: "trips.cards.leave", values: { date: day(stop.depart) } })}
            </StationDetail>
          )}
          {stop.nights !== null && (
            <StationDetail>
              {translate({ translateId: "trips.cards.nights", values: { count: stop.nights } })}
            </StationDetail>
          )}
          {current && <CurrentChip days={untilArrival} />}
        </>
      ),
    });
  });

  if (view.backHome !== null) {
    const { city, date } = view.backHome;
    const days = date === null ? null : daysBetween({ from: today, to: date });
    stations.push({
      id: "back-home",
      variant: "hub",
      name: stationName({ city, label: translate({ translateId: "trips.cards.backHome" }) }),
      meta: (
        <>
          <StationDetail strong>
            {date === null
              ? translate({ translateId: "trips.cards.dateTbd" })
              : translate({ translateId: "trips.cards.returns", values: { date: day(date) } })}
          </StationDetail>
          {days !== null && days >= 0 && (
            <StationDetail>
              {translate({ translateId: "trips.cards.endsIn", values: { days } })}
            </StationDetail>
          )}
        </>
      ),
    });
  }

  return (
    // biome-ignore lint/a11y/noNoninteractiveTabindex: a sideways-scrolling region must be reachable by keyboard.
    <section
      ref={scroller}
      aria-label={translate({ translateId: "trips.cards.routeLabel" })}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: a sideways-scrolling region must be reachable by keyboard.
      tabIndex={0}
      className="lg:overflow-x-auto lg:pb-2"
    >
      <RouteLine stops={stations} size="md" className="route-horizontal" />
    </section>
  );
}
