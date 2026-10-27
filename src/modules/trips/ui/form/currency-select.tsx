"use client";

import { useLocale } from "next-intl";
import { useEffect, useId, useState } from "react";
import { useTranslatable } from "@/shared/ui/translatable";

type CurrencySelectProps = {
  value: string;
  onChange: (currency: string) => void;
};

/** Native select over the ISO 4217 list, named in the active locale (plan D-8). */
export function CurrencySelect({ value, onChange }: CurrencySelectProps) {
  const translate = useTranslatable();
  const locale = useLocale();
  const id = useId();
  const names = new Intl.DisplayNames(locale, { type: "currency" });
  // The server and the browser ship different ICU data, so the full
  // list and the names are only rendered after hydration. Before that
  // the select holds just the current code.
  const [codes, setCodes] = useState<string[] | null>(null);

  useEffect(() => {
    setCodes(Intl.supportedValuesOf("currency"));
  }, []);

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-semibold text-text">
        {translate({ translateId: "trips.form.currency" })}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="select-themed min-h-touch rounded-md border-2 border-text bg-surface-1 px-4 text-md text-text tabular-nums"
      >
        {(codes ?? [value]).map((code) => (
          <option key={code} value={code}>
            {codes === null ? code : `${code} – ${names.of(code)}`}
          </option>
        ))}
      </select>
    </div>
  );
}
