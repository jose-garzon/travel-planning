// Client component: `buttonClasses` (D-16, same as `ThemeToggle`) is
// exported from a `"use client"` module (`button.tsx`), and RSC does
// not allow calling a client module's export as a plain function from
// a Server Component.
"use client";

import { Link } from "@/shared/i18n/navigation";
import { buttonClasses } from "@/shared/ui/components/button";
import { Panel } from "@/shared/ui/components/panel";
import { RouteLine } from "@/shared/ui/components/route-line";
import { useTranslatable } from "@/shared/ui/translatable";

/**
 * Empty-trips state (plan UC-4): an empty line. It says what the member
 * can do here, in order (route, crew, budget), and the first station is
 * open with the one action: create a trip.
 */
export function EmptyTripsState() {
  const translate = useTranslatable();

  return (
    <Panel className="flex flex-col gap-8 p-6 lg:flex-row lg:gap-16 lg:p-12">
      <div className="flex flex-col items-start gap-4 lg:basis-1/2">
        <p className="font-display text-4xl font-bold uppercase leading-none tracking-wide">
          {translate({ translateId: "trips.home.emptyState.title" })}
        </p>
        <p className="max-w-prose text-lg text-text-muted">
          {translate({ translateId: "trips.home.emptyState.description" })}
        </p>
        <Link href="/trips/new" className={buttonClasses()}>
          {translate({ translateId: "trips.home.emptyState.cta" })}
        </Link>
      </div>
      <RouteLine
        className="lg:basis-1/2"
        stops={[
          { id: "route", name: translate({ translateId: "trips.home.emptyState.stepRoute" }) },
          { id: "crew", name: translate({ translateId: "trips.home.emptyState.stepCrew" }) },
          { id: "share", name: translate({ translateId: "trips.home.emptyState.stepShare" }) },
        ]}
      />
    </Panel>
  );
}
