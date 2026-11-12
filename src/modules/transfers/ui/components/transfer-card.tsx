"use client";

import { ExternalLink, Pencil, Trash2, TriangleAlert } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { TransferDto } from "@/modules/transfers/service/schemas";
import { Button } from "@/shared/ui/components/button";
import { Icon } from "@/shared/ui/components/icon";
import { cx } from "@/shared/ui/cx";
import { formatDuration } from "@/shared/ui/duration";
import { formatMoney } from "@/shared/ui/money";
import { openTransferSheet, type TransferPrefill } from "@/shared/ui/transfer-events";

export type TransferCardProps = { transfer: TransferDto };

/** `HH:MM` in the locale's clock: "8:00 AM" (en), "08:00" (es). */
function formatTime(time: string, locale: string): string {
  const twelveHour = new Intl.DateTimeFormat(locale, { hour: "numeric" }).resolvedOptions().hour12;
  return new Intl.DateTimeFormat(locale, {
    hour: twelveHour ? "numeric" : "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(`1970-01-01T${time}:00Z`));
}

function formatDay(date: string, locale: string, style: "short" | "long"): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: style,
    month: style,
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

/** The editable fields of a transfer, as the sheet takes them (cost in major units). */
function toPrefill(transfer: TransferDto): TransferPrefill {
  return {
    id: transfer.id,
    version: transfer.version,
    mode: transfer.mode,
    from: transfer.from,
    to: transfer.to,
    departDate: transfer.departDate,
    departTime: transfer.departTime,
    departTz: transfer.departTz,
    arriveDate: transfer.arriveDate,
    arriveTime: transfer.arriveTime,
    arriveTz: transfer.arriveTz,
    cost: transfer.cost === null ? null : transfer.cost / 100,
    currency: transfer.currency,
    charge: transfer.charge,
    bookingRef: transfer.bookingRef,
    link: transfer.link,
    notes: transfer.notes,
  };
}

/** The cities with their times: "Cartagena 8:00 AM → Santa Marta 12:30 PM +1  4h 30m". */
function Journey({ transfer }: { transfer: TransferDto }) {
  const t = useTranslations("transfers.card");
  const locale = useLocale();
  const { departTime, arriveTime, durationMinutes } = transfer;
  return (
    // Cities wrap in full, never truncated.
    <p className="flex flex-wrap items-baseline gap-x-2 font-semibold text-lg leading-snug">
      <span className="break-words">{transfer.from}</span>
      {departTime === null ? null : (
        <time dateTime={`${transfer.departDate}T${departTime}`} className="tabular-nums">
          {formatTime(departTime, locale)}
        </time>
      )}
      <span aria-hidden="true">→</span>
      <span className="break-words">{transfer.to}</span>
      {arriveTime === null ? null : (
        <time
          dateTime={`${transfer.arriveDate ?? transfer.departDate}T${arriveTime}`}
          className="tabular-nums"
        >
          {formatTime(arriveTime, locale)}
        </time>
      )}
      {arriveTime !== null && transfer.dayOffset > 0 ? (
        <span className="text-sm">{t("nextDay", { days: transfer.dayOffset })}</span>
      ) : null}
      {durationMinutes === null ? null : (
        <span className="font-normal text-sm text-text-muted">
          {formatDuration(durationMinutes, locale)}
        </span>
      )}
    </p>
  );
}

/** What the screen reader says for the whole card: mode, cities, date, times, duration. */
function useSentence(transfer: TransferDto): string {
  const t = useTranslations("transfers.card");
  const locale = useLocale();
  const { departTime, arriveTime, durationMinutes } = transfer;
  return [
    t("summary", {
      mode: t(`modes.${transfer.mode}`),
      from: transfer.from,
      to: transfer.to,
      date: formatDay(transfer.departDate, locale, "long"),
    }),
    departTime === null ? null : t("departs", { time: formatTime(departTime, locale) }),
    arriveTime === null ? null : t("arrives", { time: formatTime(arriveTime, locale) }),
    durationMinutes === null ? null : formatDuration(durationMinutes, locale, "long"),
  ]
    .filter((part) => part !== null)
    .join(", ");
}

/**
 * One transfer, read view: mode, cities, times, duration, price and who
 * pays. The whole card is read as one sentence; Edit and Delete hand the
 * transfer to the sheet (`TransferSheetHost`).
 */
export function TransferCard({ transfer }: TransferCardProps) {
  const t = useTranslations("transfers.card");
  const locale = useLocale();
  const sentence = useSentence(transfer);
  const warnings = [
    transfer.routeChanged ? t("routeChanged") : null,
    transfer.needsReview ? t("needsReview") : null,
    transfer.outsideWindow ? t("outsideWindow") : null,
  ].filter((warning) => warning !== null);

  function hand(action: "edit" | "delete") {
    openTransferSheet({ gap: transfer.gap, action, prefill: toPrefill(transfer) });
  }

  return (
    <article
      aria-label={sentence}
      className={cx(
        "flex flex-col gap-2 rounded-md border border-border-strong bg-surface-1 p-4",
        transfer.isPast && "text-text-muted",
      )}
    >
      <p className="flex flex-wrap items-baseline gap-x-3 text-sm">
        <span className="font-bold font-display text-lg uppercase tracking-wide">
          {t(`modes.${transfer.mode}`)}
        </span>
        <time dateTime={transfer.departDate}>
          {formatDay(transfer.departDate, locale, "short")}
        </time>
      </p>
      <Journey transfer={transfer} />
      <p className="text-sm text-text-muted">
        {transfer.cost === null || transfer.currency === null
          ? t("noPrice")
          : t("each", { amount: formatMoney(transfer.cost, transfer.currency, locale) })}
        {` · ${t(`charge.${transfer.charge}`)}`}
      </p>
      {transfer.bookingRef === null ? null : (
        <p className="text-sm">{t("reference", { reference: transfer.bookingRef })}</p>
      )}
      {transfer.notes === null ? null : <p className="break-words text-sm">{transfer.notes}</p>}
      {transfer.link === null ? null : (
        <a
          href={transfer.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-touch items-center gap-1 self-start font-semibold text-sm underline"
        >
          {t("openBooking")}
          <span className="sr-only">{t("newTab")}</span>
          <Icon icon={ExternalLink} size="sm" />
        </a>
      )}
      {warnings.map((warning) => (
        <p key={warning} className="flex items-center gap-2 font-semibold text-error text-sm">
          <Icon icon={TriangleAlert} size="sm" />
          {warning}
        </p>
      ))}
      <div className="flex gap-2 border-border border-t pt-3">
        <Button
          type="button"
          size="sm"
          variant="outline"
          icon={Pencil}
          aria-label={t("editLabel", { from: transfer.from, to: transfer.to })}
          onClick={() => hand("edit")}
        >
          {t("edit")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          icon={Trash2}
          aria-label={t("deleteLabel", { from: transfer.from, to: transfer.to })}
          onClick={() => hand("delete")}
        >
          {t("delete")}
        </Button>
      </div>
    </article>
  );
}
