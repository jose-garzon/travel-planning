"use client";

import { useLocale } from "next-intl";
import { useEffect, useId, useState } from "react";
import { currencyForLanguage } from "@/modules/trips/ui/form/region-currency";
import type { Translatable } from "@/shared/ui/translatable";
import { useTranslatable } from "@/shared/ui/translatable";

type CurrencySelectProps = {
  value: string;
  onChange: (currency: string) => void;
  /** Shown under the select, e.g. what changing it does to existing amounts. */
  hint?: Translatable;
};

/** Native select over the ISO 4217 list, named in the active locale (plan D-8). */
export function CurrencySelect({ value, onChange, hint }: CurrencySelectProps) {
  const translate = useTranslatable();
  const locale = useLocale();
  const id = useId();
  const names = new Intl.DisplayNames(locale, { type: "currency" });
  // The server and the browser ship different ICU data, so the full
  // list and the names are only rendered after hydration. Before that
  // the select holds just the current code.
  const [codes, setCodes] = useState<string[] | null>(null);
  // The user's region currency and the two most traveled with, first.
  const [suggested, setSuggested] = useState<string[]>([]);

  useEffect(() => {
    setCodes(Intl.supportedValuesOf("currency"));
    setSuggested([...new Set([currencyForLanguage(navigator.language), "USD", "EUR"])]);
  }, []);

  const label = (code: string) => (codes === null ? code : `${code} – ${names.of(code)}`);

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-semibold text-text">
        {translate({ translateId: "trips.form.currency" })}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby={hint === undefined ? undefined : `${id}-hint`}
        className="select-themed min-h-touch rounded-md border-2 border-text bg-surface-1 px-4 text-md text-text tabular-nums"
      >
        {codes === null ? (
          <option value={value}>{value}</option>
        ) : (
          <>
            <optgroup label={translate({ translateId: "trips.form.suggestedCurrencies" })}>
              {suggested.map((code) => (
                <option key={code} value={code}>
                  {label(code)}
                </option>
              ))}
            </optgroup>
            <optgroup label={translate({ translateId: "trips.form.allCurrencies" })}>
              {codes
                .filter((code) => !suggested.includes(code))
                .map((code) => (
                  <option key={code} value={code}>
                    {label(code)}
                  </option>
                ))}
            </optgroup>
          </>
        )}
      </select>
      {hint !== undefined && (
        <p id={`${id}-hint`} className="text-sm text-text-muted">
          {translate(hint)}
        </p>
      )}
    </div>
  );
}
