import { useTranslatable } from "@/shared/ui/translatable";

/**
 * Empty-trips state (plan UC-4). Static shell for T00 — T03 adds the
 * decorative icon and the "create your first trip" button linking to
 * the placeholder `/[locale]/trips/new` route.
 */
export function EmptyTripsState() {
  const translate = useTranslatable();

  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <p className="text-lg font-semibold text-text">
        {translate({ translateId: "trips.emptyState.title" })}
      </p>
      <p className="text-text-muted">
        {translate({ translateId: "trips.emptyState.description" })}
      </p>
    </div>
  );
}
