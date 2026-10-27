"use client";

import { useEffect, useRef, useState } from "react";
import type { CityRef } from "@/modules/trips/domain/trip";
import type { TripInput } from "@/modules/trips/service/schemas";
import { CurrencySelect } from "@/modules/trips/ui/form/currency-select";
import { LegFields } from "@/modules/trips/ui/form/leg-fields";
import { currencyForLanguage } from "@/modules/trips/ui/form/region-currency";
import { useRouter } from "@/shared/i18n/navigation";
import { Button } from "@/shared/ui/components/button";
import { Input } from "@/shared/ui/components/input";
import { useTranslatable } from "@/shared/ui/translatable";

const EMPTY_CITY: CityRef = { cityId: null, code: "", name: "" };
const DEFAULT_CURRENCY = "USD";

type FieldErrors = { name: boolean; from: boolean; to: boolean };

function validate(name: string, from: CityRef, to: CityRef): FieldErrors {
  return { name: name.trim() === "", from: from.name === "", to: to.name === "" };
}

/** Create-trip form: name, currency and one leg with an optional date (the boarding-pass form grows in later tasks). */
export function TripForm() {
  const translate = useTranslatable();
  const router = useRouter();
  const nameRef = useRef<HTMLInputElement>(null);
  const fromRef = useRef<HTMLInputElement>(null);
  const toRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [from, setFrom] = useState(EMPTY_CITY);
  const [to, setTo] = useState(EMPTY_CITY);
  const [date, setDate] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({ name: false, from: false, to: false });
  const [hasSaveError, setHasSaveError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // The server cannot know `navigator.language`, so the default applies after hydration.
  useEffect(() => {
    setCurrency(currencyForLanguage(navigator.language));
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const found = validate(name, from, to);
    setErrors(found);
    const firstInvalid = [found.name && nameRef, found.from && fromRef, found.to && toRef].find(
      Boolean,
    );
    if (firstInvalid) {
      firstInvalid.current?.focus();
      return;
    }

    const input: TripInput = {
      name: name.trim(),
      currency,
      legs: [{ from, to, date: date === "" ? null : date }],
    };
    setIsSaving(true);
    setHasSaveError(false);
    try {
      const response = await fetch("/api/v1/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (response.status !== 201) {
        setHasSaveError(true);
        return;
      }
      router.push({ pathname: "/", query: { created: "1" } });
    } catch {
      setHasSaveError(true);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-10">
      <Input
        ref={nameRef}
        appearance="title"
        placeholder={translate({ translateId: "trips.form.namePlaceholder" })}
        label={{ translateId: "trips.form.tripName" }}
        value={name}
        onChange={(event) => setName(event.target.value)}
        error={errors.name ? { translateId: "trips.form.errors.nameRequired" } : undefined}
      />
      <LegFields
        legNumber={1}
        fromRef={fromRef}
        toRef={toRef}
        fromError={errors.from ? { translateId: "trips.form.errors.fromRequired" } : undefined}
        toError={errors.to ? { translateId: "trips.form.errors.toRequired" } : undefined}
        onFromChange={setFrom}
        onToChange={setTo}
        toName={to.name}
        date={date}
        onDateChange={setDate}
      />
      <CurrencySelect value={currency} onChange={setCurrency} />
      {hasSaveError && (
        <p role="alert" className="text-error">
          {translate({ translateId: "trips.form.errors.saveFailed" })}
        </p>
      )}
      {/* Pinned on mobile so the one action is always in reach. */}
      <div className="sticky bottom-0 -mx-6 bg-bg px-6 pt-3 pb-6 sm:static sm:mx-0 sm:p-0">
        <div className="flex flex-col sm:items-start">
          <Button type="submit" isLoading={isSaving} translateId="trips.form.submit" />
        </div>
      </div>
    </form>
  );
}
