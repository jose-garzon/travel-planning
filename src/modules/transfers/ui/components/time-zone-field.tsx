"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/shared/ui/components/input";

export type TimeZoneFieldProps = {
  name: string;
  /** Which end of the journey: "Departure" or "Arrival", already translated. */
  end: string;
  defaultValue?: string | null;
};

/** An IANA zone for a city the app has no zone for ("Europe/Madrid"). */
export function TimeZoneField({ name, end, defaultValue }: TimeZoneFieldProps) {
  const t = useTranslations("transfers.form");
  return (
    <Input
      name={name}
      label={t("zone", { label: end })}
      hint={t("zoneHint")}
      defaultValue={defaultValue ?? undefined}
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
    />
  );
}
