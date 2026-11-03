"use client";

import { useEffect, useRef, useState } from "react";
import type { TripInput } from "@/modules/trips/service/schemas";
import { CurrencySelect } from "@/modules/trips/ui/form/currency-select";
import { LegFields } from "@/modules/trips/ui/form/leg-fields";
import { currencyForLanguage } from "@/modules/trips/ui/form/region-currency";
import type { LegErrors } from "@/modules/trips/ui/form/use-route-editor";
import { legErrors, MAX_LEGS, useRouteEditor } from "@/modules/trips/ui/form/use-route-editor";
import { useRouter } from "@/shared/i18n/navigation";
import { Button } from "@/shared/ui/components/button";
import { Input } from "@/shared/ui/components/input";
import { useTranslatable } from "@/shared/ui/translatable";

const DEFAULT_CURRENCY = "USD";

/** The user's local date, `YYYY-MM-DD` (plan D-5). */
function localToday(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${now.getFullYear()}-${month}-${day}`;
}

/** Create-trip form: name, currency and the route as a chain of legs. */
export function TripForm() {
  const translate = useTranslatable();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  const editor = useRouteEditor();
  const { legs, change } = editor;

  const [name, setName] = useState("");
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [nameError, setNameError] = useState(false);
  const [errors, setErrors] = useState<LegErrors[]>([]);
  const [submitAttempt, setSubmitAttempt] = useState(0);
  const [hasSaveError, setHasSaveError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // The server cannot know `navigator.language`, so the default applies after hydration.
  useEffect(() => {
    setCurrency(currencyForLanguage(navigator.language));
  }, []);

  // After a failed submit, focus the first invalid field in page order.
  useEffect(() => {
    if (submitAttempt > 0) {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    }
  }, [submitAttempt]);

  // Focus rules (feature.md "Accessibility"): new leg's To field; after a
  // removal the previous leg's remove button, or "Add a leg" when none.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs once per change
  useEffect(() => {
    if (change === null) {
      return;
    }
    const leg = change.focusLegId === null ? null : `[data-leg-id="${change.focusLegId}"]`;
    const target =
      change.kind === "added"
        ? formRef.current?.querySelector<HTMLElement>(
            `${leg} [data-field="to"] input:not([readonly])`,
          )
        : formRef.current?.querySelector<HTMLElement>(`${leg} button[data-remove]:not(:disabled)`);
    (target ?? addRef.current)?.focus();
  }, [change?.seq]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const found = legErrors({ legs, today: localToday() });
    const isNameMissing = name.trim() === "";
    setNameError(isNameMissing);
    setErrors(found);
    if (isNameMissing || found.some((leg) => leg.from || leg.to || leg.date)) {
      setSubmitAttempt((count) => count + 1);
      return;
    }

    const input: TripInput = {
      name: name.trim(),
      currency,
      legs: legs.map(({ from, to, date }) => ({ from, to, date: date === "" ? null : date })),
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

  const announcement =
    change === null
      ? ""
      : translate({
          translateId: change.kind === "added" ? "trips.form.legAdded" : "trips.form.legRemoved",
          values: { number: change.legNumber },
        });

  return (
    <form ref={formRef} noValidate onSubmit={handleSubmit} className="flex flex-col gap-10">
      <Input
        appearance="title"
        placeholder={translate({ translateId: "trips.form.namePlaceholder" })}
        label={{ translateId: "trips.form.tripName" }}
        value={name}
        onChange={(event) => setName(event.target.value)}
        error={nameError ? { translateId: "trips.form.errors.nameRequired" } : undefined}
      />
      {legs.map((leg, index) => (
        <LegFields
          key={leg.id}
          legNumber={index + 1}
          leg={leg}
          errors={errors[index] ?? {}}
          onFromChange={(city) => editor.setFrom(index, city)}
          onToChange={(city) => editor.setTo(index, city)}
          onDateChange={(date) => editor.setDate(index, date)}
          onRemove={() => editor.removeLeg(index)}
          canRemove={editor.canRemoveLeg}
        />
      ))}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          ref={addRef}
          type="button"
          variant="secondary"
          disabled={!editor.canAddLeg}
          translateId="trips.form.addLeg"
          onClick={editor.addLeg}
        />
        <Button
          type="button"
          variant="secondary"
          disabled={!editor.canAddReturnHome}
          translateId="trips.form.addReturnHome"
          onClick={editor.addReturnHome}
        />
        {!editor.canAddLeg && (
          <p className="text-sm text-text-muted">
            {translate({ translateId: "trips.form.legLimit", values: { max: MAX_LEGS } })}
          </p>
        )}
      </div>
      <CurrencySelect value={currency} onChange={setCurrency} />
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>
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
