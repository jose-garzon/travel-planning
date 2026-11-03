import type { ReactNode } from "react";
import type { CityRef } from "@/modules/trips/domain/trip";
import { cx } from "@/shared/ui/cx";
import { useTranslatable } from "@/shared/ui/translatable";

type StationName = {
  city: CityRef;
  /** "Takeoff" / "Back home" label shown before the code. */
  label?: string;
  current?: boolean;
};

/** Station name for `RouteLine`: the code large, the city smaller. */
export function stationName({ city, label, current = false }: StationName): ReactNode {
  return (
    <>
      <span data-testid="stop-name" aria-current={current ? "step" : undefined}>
        {label !== undefined && `${label} `}
        {city.code}
      </span>
      <span className="mt-1 block font-body text-base font-normal normal-case tracking-normal">
        {city.name}
      </span>
    </>
  );
}

/** One line of a station's details, quiet unless `strong`. */
export function StationDetail({
  children,
  strong = false,
}: {
  children: ReactNode;
  strong?: boolean;
}) {
  return <span className={cx("block", strong && "font-semibold text-text")}>{children}</span>;
}

/** The "now" chip on the current stop: countdown, or "You are here". */
export function CurrentChip({ days }: { days: number | null }) {
  const translate = useTranslatable();

  return (
    <span className="mt-2 inline-block rounded-full bg-sun px-3 py-1 font-semibold text-on-sun">
      {days === null
        ? translate({ translateId: "trips.cards.here" })
        : translate({ translateId: "trips.home.countdown", values: { days } })}
    </span>
  );
}
