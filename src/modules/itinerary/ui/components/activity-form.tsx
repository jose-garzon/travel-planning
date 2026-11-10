"use client";

import { ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import type { ActivityDto, ActivityInput } from "@/modules/itinerary/service/schemas";
import { Button } from "@/shared/ui/components/button";
import { Icon } from "@/shared/ui/components/icon";
import { Input } from "@/shared/ui/components/input";

export type ActivityFormProps = {
  tripCurrency: string;
  startDate: string | null;
  endDate: string | null;
  initial?: ActivityDto;
  /** Resolves to an error message, or null when saved. */
  onSubmit: (input: ActivityInput) => Promise<string | null>;
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
}: ActivityFormProps) {
  const t = useTranslations("itinerary.activities");
  const locale = useLocale();
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

  const days = tripDays(startDate, endDate);
  const hasDetails = hasOptionalDetails(initial);

  return (
    <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
      <Input
        name="title"
        label={t("title")}
        defaultValue={initial?.title}
        required
        maxLength={80}
      />
      {days === null ? (
        <Input
          name="date"
          type="date"
          label={t("day")}
          defaultValue={initial?.date ?? startDate ?? undefined}
          min={startDate ?? undefined}
          max={endDate ?? undefined}
          required
        />
      ) : (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-semibold text-sm">{t("day")}</legend>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {days.map((day, index) => (
              <label key={day} className="day-chip">
                <input
                  type="radio"
                  name="date"
                  value={day}
                  defaultChecked={(initial?.date ?? days[0]) === day}
                  className="sr-only"
                />
                <span className="text-xs uppercase">{weekday(day)}</span>
                <span className="font-bold font-display text-2xl leading-none tabular-nums">
                  {dayNumber(day)}
                </span>
                {index === 0 || dayNumber(day) === "1" ? (
                  <span className="text-xs">{month(day)}</span>
                ) : (
                  <span aria-hidden="true" className="text-xs">
                    &nbsp;
                  </span>
                )}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <details open={hasDetails} className="group flex flex-col">
        <summary className="flex min-h-touch cursor-pointer list-none items-center gap-2 font-semibold">
          <span className="inline-flex transition group-open:rotate-90">
            <Icon icon={ChevronRight} size="sm" />
          </span>
          {t("moreDetails")}
        </summary>
        <div className="mt-3 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              name="startTime"
              type="time"
              label={t("startTime")}
              defaultValue={initial?.startTime ?? undefined}
            />
            <Input
              name="duration"
              type="number"
              min={1}
              inputMode="numeric"
              label={t("duration")}
              defaultValue={initial?.durationMinutes ?? undefined}
            />
          </div>
          <div className="grid grid-cols-amount gap-3">
            <Input
              name="cost"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              label={t("cost")}
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
            defaultValue={initial?.link ?? undefined}
          />
        </div>
      </details>
      {error === null ? null : (
        <p role="alert" className="text-error">
          {error}
        </p>
      )}
      <Button type="submit" isLoading={isSaving}>
        {t("save")}
      </Button>
    </form>
  );

  function weekday(day: string) {
    return format(day, { weekday: "short" });
  }
  function dayNumber(day: string) {
    return format(day, { day: "numeric" });
  }
  function month(day: string) {
    return format(day, { month: "short" });
  }
  function format(day: string, options: Intl.DateTimeFormatOptions) {
    return new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).format(
      new Date(`${day}T00:00:00Z`),
    );
  }
}

/** An edited activity with any optional field set opens "More details". */
function hasOptionalDetails(initial: ActivityDto | undefined): boolean {
  return (
    initial !== undefined &&
    (initial.startTime !== null ||
      initial.durationMinutes !== null ||
      initial.costPerPerson !== null ||
      initial.link !== null)
  );
}

/** Every day of the trip, when it has both ends and fits a chip row. */
function tripDays(startDate: string | null, endDate: string | null): string[] | null {
  if (startDate === null || endDate === null) {
    return null;
  }
  const days: string[] = [];
  const cursor = new Date(`${startDate}T00:00:00Z`);
  const last = new Date(`${endDate}T00:00:00Z`);
  while (cursor <= last && days.length <= 31) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days.length === 0 || days.length > 31 ? null : days;
}
