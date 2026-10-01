// Client component: `buttonClasses` (D-16, same as `ThemeToggle`) is
// exported from a `"use client"` module (`button.tsx`), and RSC does
// not allow calling a client module's export as a plain function from
// a Server Component.
"use client";

import { Compass } from "lucide-react";
import { Link } from "@/shared/i18n/navigation";
import { buttonClasses } from "@/shared/ui/components/button";
import { Icon } from "@/shared/ui/components/icon";
import { useTranslatable } from "@/shared/ui/translatable";

/**
 * Empty-trips state (plan UC-4): a decorative icon, title, description
 * and a CTA linking to the placeholder `/[locale]/trips/new` route
 * (plan D-4: real trip creation is left to a future feature). The CTA
 * navigates rather than performing an action in place, so it is a
 * `Link` styled like a button (`buttonClasses`), not a `Button`.
 */
export function EmptyTripsState() {
  const translate = useTranslatable();

  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <Icon icon={Compass} size="lg" />
      <p className="text-lg font-semibold text-text">
        {translate({ translateId: "trips.emptyState.title" })}
      </p>
      <p className="text-text-muted">
        {translate({ translateId: "trips.emptyState.description" })}
      </p>
      <Link href="/trips/new" className={buttonClasses()}>
        {translate({ translateId: "trips.emptyState.cta" })}
      </Link>
    </div>
  );
}
