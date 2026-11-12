"use client";

import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import type { Gap, GapCity } from "@/modules/transfers/domain/gaps";
import { TRANSFER_MODES } from "@/modules/transfers/domain/transfer";
import type { TransferInput } from "@/modules/transfers/service/schemas";
import { TimeZoneField } from "@/modules/transfers/ui/components/time-zone-field";
import { Button } from "@/shared/ui/components/button";
import { Icon } from "@/shared/ui/components/icon";
import { Input } from "@/shared/ui/components/input";
import type { TransferPrefill } from "@/shared/ui/transfer-events";

export type TransferFormProps = {
  gap: Gap;
  tripCurrency: string;
  /** Values to start from: an edit (has `id`) or an agent's proposal. */
  initial?: TransferPrefill;
  /** Resolves to an error message, or null when saved. */
  onSubmit: (input: TransferInput) => Promise<string | null>;
};

const SELECT_CLASSES =
  "min-h-touch rounded-md border border-border-strong bg-surface-1 px-4 text-md text-text";

function text(form: FormData, name: string): string {
  return String(form.get(name) ?? "").trim();
}

function plain(name: string): string {
  return name.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}

/** The zone the app knows for `name`: the gap's city, when the traveler kept its name. */
function knownZone(name: string, city: GapCity | null): string | null {
  return city?.tz != null && plain(name) === plain(city.name) ? city.tz : null;
}

/** The trip's origin is known, so an outbound gap prefills both; a return only the origin. */
function defaultCities(gap: Gap): { from: string; to: string } {
  return {
    from: gap.from?.name ?? "",
    to: gap.kind === "return" ? "" : (gap.to?.name ?? ""),
  };
}

function entered(form: FormData, name: string): string | null {
  return text(form, name) || null;
}

/** The fields as the API takes them; a zone travels only with its time. */
function readInput(
  form: FormData,
  {
    gap,
    tripCurrency,
    currency,
    zones,
  }: {
    gap: Gap;
    tripCurrency: string;
    currency: string;
    zones: { depart: string | null; arrive: string | null };
  },
): TransferInput {
  const departTime = entered(form, "departTime");
  const arriveTime = entered(form, "arriveTime");
  const costText = text(form, "cost");
  const cost = costText === "" ? null : Number(costText);
  const code = currency.toUpperCase() || tripCurrency;
  return {
    gap: gap.index,
    mode: text(form, "mode") as TransferInput["mode"],
    from: text(form, "from"),
    to: text(form, "to"),
    departDate: text(form, "departDate"),
    departTime,
    departTz: departTime === null ? null : (zones.depart ?? entered(form, "departTz")),
    arriveDate: entered(form, "arriveDate"),
    arriveTime,
    arriveTz: arriveTime === null ? null : (zones.arrive ?? entered(form, "arriveTz")),
    cost,
    currency: cost === null ? null : code,
    rate: cost === null || code === tripCurrency ? null : entered(form, "rate"),
    charge: text(form, "charge") === "opt-in" ? "opt-in" : "all",
    bookingRef: entered(form, "bookingRef"),
    link: entered(form, "link"),
    notes: entered(form, "notes"),
  };
}

/** Booking reference, link and notes; open when the transfer already has some. */
function MoreDetails({ initial }: { initial?: TransferPrefill }) {
  const t = useTranslations("transfers.form");
  const hasDetails = [initial?.bookingRef, initial?.link, initial?.notes].some(
    (value) => value != null && value !== "",
  );
  return (
    <details open={hasDetails} className="group flex flex-col">
      <summary className="flex min-h-touch cursor-pointer list-none items-center gap-2 font-semibold">
        <span className="inline-flex transition group-open:rotate-90">
          <Icon icon={ChevronRight} size="sm" />
        </span>
        {t("moreDetails")}
      </summary>
      <div className="mt-3 flex flex-col gap-4">
        <Input
          name="bookingRef"
          label={t("bookingRef")}
          maxLength={60}
          defaultValue={initial?.bookingRef ?? undefined}
        />
        <Input name="link" type="url" label={t("link")} defaultValue={initial?.link ?? undefined} />
        <Input
          name="notes"
          label={t("notes")}
          maxLength={500}
          defaultValue={initial?.notes ?? undefined}
        />
      </div>
    </details>
  );
}

/**
 * Add or edit one transfer. Cities, day and kind are enough; times, cost and
 * booking details are optional. A zone is asked for only where the app does
 * not know the city's.
 */
export function TransferForm({ gap, tripCurrency, initial, onSubmit }: TransferFormProps) {
  const t = useTranslations("transfers.form");
  const tc = useTranslations("transfers.card");
  const defaults = defaultCities(gap);
  const [from, setFrom] = useState(initial?.from ?? defaults.from);
  const [to, setTo] = useState(initial?.to ?? defaults.to);
  const [currency, setCurrency] = useState(initial?.currency ?? tripCurrency);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fromZone = knownZone(from, gap.from);
  const toZone = knownZone(to, gap.to);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = readInput(new FormData(event.currentTarget), {
      gap,
      tripCurrency,
      currency,
      zones: { depart: fromZone, arrive: toZone },
    });
    if (input.from === "" || input.to === "" || input.departDate === "") {
      setError(t("required"));
      return;
    }
    setIsSaving(true);
    setError(await onSubmit(input));
    setIsSaving(false);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
      <label className="flex flex-col gap-1">
        <span className="font-semibold text-sm">{t("mode")}</span>
        <select name="mode" defaultValue={initial?.mode ?? "flight"} className={SELECT_CLASSES}>
          {TRANSFER_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {tc(`modes.${mode}`)}
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <Input
          name="from"
          label={t("from")}
          value={from}
          onChange={(event) => setFrom(event.target.value)}
          maxLength={120}
          required
        />
        <Input
          name="to"
          label={t("to")}
          value={to}
          onChange={(event) => setTo(event.target.value)}
          maxLength={120}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          name="departDate"
          type="date"
          label={t("departDate")}
          defaultValue={initial?.departDate ?? gap.date ?? undefined}
          required
        />
        <Input
          name="departTime"
          type="time"
          label={t("departTime")}
          defaultValue={initial?.departTime ?? undefined}
        />
        <Input
          name="arriveDate"
          type="date"
          label={t("arriveDate")}
          defaultValue={initial?.arriveDate ?? undefined}
        />
        <Input
          name="arriveTime"
          type="time"
          label={t("arriveTime")}
          defaultValue={initial?.arriveTime ?? undefined}
        />
      </div>
      {fromZone === null ? (
        <TimeZoneField name="departTz" end={t("departure")} defaultValue={initial?.departTz} />
      ) : null}
      {toZone === null ? (
        <TimeZoneField name="arriveTz" end={t("arrival")} defaultValue={initial?.arriveTz} />
      ) : null}
      <div className="grid grid-cols-amount gap-3">
        <Input
          name="cost"
          type="number"
          min={0}
          step="0.01"
          inputMode="decimal"
          label={t("cost")}
          defaultValue={initial?.cost ?? undefined}
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
          hint={t("rateHint")}
          defaultValue={initial?.rate ?? undefined}
          required
        />
      ) : null}
      <fieldset className="flex flex-wrap gap-x-6">
        <legend className="mb-1 font-semibold text-sm">{t("charge")}</legend>
        {(["all", "opt-in"] as const).map((charge) => (
          <label key={charge} className="flex min-h-touch items-center gap-2">
            <input
              type="radio"
              name="charge"
              value={charge}
              defaultChecked={(initial?.charge ?? "all") === charge}
            />
            {tc(`charge.${charge}`)}
          </label>
        ))}
      </fieldset>
      <MoreDetails initial={initial} />
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
}
