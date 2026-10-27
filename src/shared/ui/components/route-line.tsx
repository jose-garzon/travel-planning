import type { ReactNode } from "react";
import { cx } from "@/shared/ui/cx";

export type RouteStop = {
  /** Stable key: a city id, a leg index. */
  id: string;
  /** Station name, set in the condensed display face. */
  name: ReactNode;
  /** One line under the name: dates, nights, who's going. */
  meta?: ReactNode;
  /** `hub` fills the ring (takeoff, home again); `new` plays the draw-in. */
  variant?: "default" | "hub" | "new";
};

type RouteLineProps = {
  stops: RouteStop[];
  /** Rendered as a last, open (dashed) station: where the next city goes. */
  open?: ReactNode;
  /** Station name size. `lg` for a trip's own page, `md` in lists. */
  size?: "md" | "lg";
  className?: string;
  /** Accessible name of the list, e.g. "Route". */
  label?: string;
};

const NAME_SIZE = { md: "text-2xl", lg: "text-3xl lg:text-4xl" } as const;

/**
 * The signature of the metro line world (DESIGN.md): a trip's cities as
 * stations on one thick line. An ordered list, so the order is read
 * out; the line and rings are CSS on each item.
 */
export function RouteLine({ stops, open, size = "md", className, label }: RouteLineProps) {
  return (
    <ol aria-label={label} className={cx("route", className)}>
      {stops.map((stop) => (
        <li
          key={stop.id}
          className={cx(
            "route-stop",
            stop.variant === "hub" && "route-stop-hub",
            stop.variant === "new" && "route-stop-new",
          )}
        >
          <span
            className={cx(
              "block font-display font-bold uppercase leading-none tracking-wide wrap-anywhere",
              NAME_SIZE[size],
            )}
          >
            {stop.name}
          </span>
          {stop.meta !== undefined && (
            <span className="mt-1 block text-sm text-text-muted">{stop.meta}</span>
          )}
        </li>
      ))}
      {open !== undefined && <li className="route-stop route-stop-open">{open}</li>}
    </ol>
  );
}
