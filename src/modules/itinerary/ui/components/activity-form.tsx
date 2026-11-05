"use client";

import { useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import type { ActivityDto, ActivityInput } from "@/modules/itinerary/service/schemas";
import { Button } from "@/shared/ui/components/button";
import { Input } from "@/shared/ui/components/input";

export type ActivityFormProps = {
  tripCurrency: string;
  startDate: string | null;
  endDate: string | null;
  initial?: ActivityDto;
  /** Resolves to an error message, or null when saved. */
  onSubmit: (input: ActivityInput) => Promise<string | null>;
  onCancel: () => void;
};

function text(form: FormData, name: string): string {
  return String(form.get(name) ?? "").trim();
}

function optionalNumber(value: string): number | null {
  return value === "" ? null : Number(value);
}

/** Add or edit one activity. Only the title and day are required. */
export function ActivityForm({
  tripCurrency,
  startDate,
  endDate,
  initial,
  onSubmit,
  onCancel,
}: ActivityFormProps) {
  const t = useTranslations("itinerary.activities");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currency, setCurrency] = useState(initial?.currency ?? tripCurrency);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const cost = optionalNumber(text(form, "cost"));
    const input: ActivityInput = {
      title: text(form, "title"),
      date: text(form, "date"),
      startTime: text(form, "startTime") || null,
      durationMinutes: optionalNumber(text(form, "duration")),
      costPerPerson: cost,
      currency: cost === null ? null : text(form, "currency").toUpperCase() || tripCurrency,
      rate: text(form, "rate") || null,
      link: text(form, "link") || null,
    };
    if (input.title === "" || input.date === "") {
      setError(t("required"));
      return;
    }
    setIsSaving(true);
    setError(await onSubmit(input));
    setIsSaving(false);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
      <Input
        name="title"
        label={t("title")}
        defaultValue={initial?.title}
        required
        maxLength={80}
      />
      <Input
        name="date"
        type="date"
        label={t("day")}
        defaultValue={initial?.date ?? startDate ?? undefined}
        min={startDate ?? undefined}
        max={endDate ?? undefined}
        required
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          name="startTime"
          type="time"
          label={t("startTime")}
          hint={t("optional")}
          defaultValue={initial?.startTime ?? undefined}
        />
        <Input
          name="duration"
          type="number"
          min={1}
          inputMode="numeric"
          label={t("duration")}
          hint={t("optional")}
          defaultValue={initial?.durationMinutes ?? undefined}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          name="cost"
          type="number"
          min={0}
          step="0.01"
          inputMode="decimal"
          label={t("cost")}
          hint={t("optional")}
          defaultValue={
            initial?.costPerPerson === null || initial === undefined
              ? undefined
              : initial.costPerPerson / 100
          }
        />
        <Input
          name="currency"
          label={t("currency")}
          maxLength={3}
          value={currency}
          onChange={(event) => setCurrency(event.target.value.toUpperCase())}
        />
      </div>
      {currency !== tripCurrency ? (
        <Input
          name="rate"
          type="number"
          min={0}
          step="any"
          inputMode="decimal"
          label={t("rate", { from: currency || "?", to: tripCurrency })}
          defaultValue={initial?.rate ?? undefined}
        />
      ) : null}
      <Input
        name="link"
        type="url"
        label={t("link")}
        hint={t("optional")}
        defaultValue={initial?.link ?? undefined}
      />
      {error === null ? null : (
        <p role="alert" className="text-error">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" isLoading={isSaving}>
          {t("save")}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}
