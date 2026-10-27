// Client component: `buttonClasses` is exported from a "use client"
// module (see empty-trips-state.tsx).
"use client";

import { Plus } from "lucide-react";
import { Link } from "@/shared/i18n/navigation";
import { buttonClasses } from "@/shared/ui/components/button";
import { Icon } from "@/shared/ui/components/icon";
import { useTranslatable } from "@/shared/ui/translatable";

/** The "New trip" action on home, styled as the primary button. */
export function NewTripLink() {
  const translate = useTranslatable();

  return (
    <Link href="/trips/new" className={buttonClasses()}>
      <Icon icon={Plus} size="md" />
      {translate({ translateId: "trips.home.newTrip" })}
    </Link>
  );
}
