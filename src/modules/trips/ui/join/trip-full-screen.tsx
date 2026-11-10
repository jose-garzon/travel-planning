"use client";

import { useTranslations } from "next-intl";
import { MAX_MEMBERS } from "@/modules/trips/domain/membership";
import { Link } from "@/shared/i18n/navigation";
import { buttonClasses } from "@/shared/ui/components/button";
import { LineClosed } from "@/shared/ui/components/line-closed";

/** The trip has `MAX_MEMBERS` travelers already (feature 009 AC-7). */
export function TripFullScreen() {
  const t = useTranslations("trips.join");

  return (
    <div className="flex flex-col items-start gap-4">
      <LineClosed className="mb-2" />
      <h1 className="font-display text-3xl font-bold leading-none">
        {t("full", { count: MAX_MEMBERS })}
      </h1>
      <Link href="/" className={buttonClasses()}>
        {t("goHome")}
      </Link>
    </div>
  );
}
