"use client";

import { useEffect, useRef, useState } from "react";
import { currentStopIndex } from "@/modules/trips/domain/current-stop";
import { stopsFromLegs } from "@/modules/trips/domain/route-view";
import type { TripDto } from "@/modules/trips/service/schemas";
import { HubStation, StopStation } from "@/modules/trips/ui/home/stop-station";
import type { RouteStop } from "@/shared/ui/components/route-line";
import { RouteLine } from "@/shared/ui/components/route-line";
import { useTranslatable } from "@/shared/ui/translatable";

type TripLineProps = {
  trip: TripDto;
  /** `YYYY-MM-DD` in the member's zone. */
  today: string;
};

// Vertical on mobile (RouteLine's own look); `route-horizontal` lays
// the same list out as a horizontal line on `lg`.
const HORIZONTAL = "lg:route-horizontal";

/**
 * A trip as stations on one line: takeoff, every stop, back home.
 * Starts scrolled to the current stop; when the horizontal line
 * overflows, its region takes focus so the keyboard can scroll it.
 */
export function TripLine({ trip, today }: TripLineProps) {
  const translate = useTranslatable();
  const scroller = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);

  const view = stopsFromLegs(trip.legs);
  const current = currentStopIndex({ view, today });
  const end = view.backHome?.date ?? view.stops[view.stops.length - 1]?.arrive ?? null;

  useEffect(() => {
    const element = scroller.current;
    if (element === null) {
      return;
    }
    const measure = () => setOverflows(element.scrollWidth > element.clientWidth);
    measure();
    window.addEventListener("resize", measure);
    const station = element.querySelector("[data-current-stop]")?.closest("li");
    if (station instanceof HTMLElement && element.scrollWidth > element.clientWidth) {
      element.scrollLeft = station.offsetLeft;
    }
    return () => window.removeEventListener("resize", measure);
  }, []);

  const stops: RouteStop[] = [
    ...(view.takeoff === null
      ? []
      : [
          {
            id: "takeoff",
            variant: "hub" as const,
            name: (
              <>
                <span className="block text-sm">
                  {translate({ translateId: "trips.cards.takeoff" })}
                </span>{" "}
                {view.takeoff.code}
              </>
            ),
            meta: <HubStation hub={view.takeoff} today={today} kind="takeoff" end={end} />,
          },
        ]),
    ...view.stops.map((stop, index) => ({
      id: `stop-${stop.number}`,
      name: stop.code,
      meta: <StopStation stop={stop} today={today} isCurrent={index === current} />,
    })),
    ...(view.backHome === null
      ? []
      : [
          {
            id: "back-home",
            variant: "hub" as const,
            name: (
              <>
                <span className="block text-sm">
                  {translate({ translateId: "trips.cards.backHome" })}
                </span>{" "}
                {view.backHome.code}
              </>
            ),
            meta: <HubStation hub={view.backHome} today={today} kind="backHome" end={end} />,
          },
        ]),
  ];

  return (
    <section
      ref={scroller}
      aria-label={translate({ translateId: "trips.cards.stopsLabel" })}
      tabIndex={overflows ? 0 : undefined}
      className="relative lg:overflow-x-auto"
    >
      <RouteLine stops={stops} className={HORIZONTAL} />
    </section>
  );
}
