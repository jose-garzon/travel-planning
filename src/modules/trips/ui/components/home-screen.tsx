import type { HomeTripsSummary } from "@/modules/trips/service/get-home-trips-summary";
import { EmptyTripsState } from "@/modules/trips/ui/components/empty-trips-state";
import { useTranslatable } from "@/shared/ui/translatable";

type HomeScreenProps = {
  displayName: string;
  summary: HomeTripsSummary;
};

/**
 * `/[locale]` for a signed-in member (plan "States": home). Static
 * shell for T00 — greets the member and shows the empty state (the
 * only summary T00's stub `getHomeTripsSummary` can return). T03 adds
 * the next-trip card, the rest-of-trips list and locale-formatted dates.
 */
export function HomeScreen({ displayName, summary }: HomeScreenProps) {
  const translate = useTranslatable();

  return (
    <main className="px-6 py-12">
      <h1 className="mb-8 text-3xl text-accent">
        {translate({ translateId: "trips.home.greeting", values: { name: displayName } })}
      </h1>
      {summary.nextTrip === null && summary.otherTrips.length === 0 && <EmptyTripsState />}
    </main>
  );
}
