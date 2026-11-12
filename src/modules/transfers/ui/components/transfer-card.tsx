"use client";

import {
  ArrowRight,
  Bus,
  Car,
  ExternalLink,
  type LucideIcon,
  Pencil,
  Plane,
  Route,
  Ship,
  TrainFront,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { TransferDto } from "@/modules/transfers/service/schemas";
import { JoinTransferToggle } from "@/modules/transfers/ui/components/join-transfer-toggle";
import { formatDay, formatTime } from "@/modules/transfers/ui/format-time";
import { Button } from "@/shared/ui/components/button";
import { Icon } from "@/shared/ui/components/icon";
import { cx } from "@/shared/ui/cx";
import { formatDuration } from "@/shared/ui/duration";
import { formatMoney } from "@/shared/ui/money";
import { openTransferSheet, type TransferPrefill } from "@/shared/ui/transfer-events";

export type TransferCardProps = {
  transfer: TransferDto;
  /** Lets the viewer join an opt-in transfer; without it the card is read-only. */
  join?: { tripId: string; viewerId: string; memberCount: number };
};

const MODE_ICONS: Record<TransferDto["mode"], LucideIcon> = {
  flight: Plane,
  train: TrainFront,
  bus: Bus,
  ferry: Ship,
  car: Car,
  other: Route,
};

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
    rate: transfer.rate,
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
    <p className="flex flex-wrap items-center gap-x-2 font-semibold leading-snug">
      <span className="break-words">{transfer.from}</span>
      {departTime === null ? null : (
        <time dateTime={`${transfer.departDate}T${departTime}`} className="tabular-nums">
          {formatTime(departTime, locale)}
        </time>
      )}
      <Icon icon={ArrowRight} size="sm" />
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

/** "1 hr 25 min" (en), "1 h 25 min" (es): the sentence reads units, not letters. */
function spokenDuration(minutes: number, locale: string): string {
  return [
    { unit: "hour", value: Math.floor(minutes / 60) },
    { unit: "minute", value: minutes % 60 },
  ]
    .filter(({ value }) => value > 0)
    .map(({ unit, value }) =>
      new Intl.NumberFormat(locale, { style: "unit", unit, unitDisplay: "short" }).format(value),
    )
    .join(" ");
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
    durationMinutes === null || durationMinutes <= 0
      ? null
      : spokenDuration(Math.round(durationMinutes), locale),
  ]
    .filter((part) => part !== null)
    .join(", ");
}

/**
 * One transfer, read view: mode, cities, times, duration, price and who
 * pays. The whole card is read as one sentence; Edit and Delete hand the
 * transfer to the sheet (`TransferSheetHost`).
 */
export function TransferCard({ transfer, join }: TransferCardProps) {
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

  const details = [
    transfer.cost === null || transfer.currency === null
      ? t("noPrice")
      : t("each", { amount: formatMoney(transfer.cost, transfer.currency, locale) }),
    t(`charge.${transfer.charge}`),
    transfer.bookingRef === null ? null : t("reference", { reference: transfer.bookingRef }),
  ].filter((part) => part !== null);

  return (
    // One row on the line: mode and day, the journey, then one muted line of
    // price and booking. Actions sit at the end as icons, never a footer.
    <article
      id={`transfer-${transfer.id}`}
      tabIndex={-1}
      aria-label={sentence}
      className={cx(
        "flex items-start gap-3 border-border border-b py-2 last:border-b-0",
        transfer.isPast && "text-text-muted",
      )}
    >
      <span className="mt-1 shrink-0 text-accent">
        <Icon icon={MODE_ICONS[transfer.mode]} size="sm" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="flex flex-wrap items-baseline gap-x-3 text-sm">
          <span className="font-bold font-display uppercase tracking-wide">
            {t(`modes.${transfer.mode}`)}
          </span>
          <time dateTime={transfer.departDate} className="text-text-muted">
            {formatDay(transfer.departDate, locale, "short")}
          </time>
          {transfer.isPast ? (
            <span className="font-semibold text-text-muted">{t("past")}</span>
          ) : null}
        </p>
        <Journey transfer={transfer} />
        <p className="flex flex-wrap items-center gap-x-1 text-sm text-text-muted">
          <span>{details.join(" · ")}</span>
          {transfer.link === null ? null : (
            <a
              href={transfer.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-touch items-center gap-1 px-1 font-semibold text-text underline underline-offset-4"
            >
              {t("openBooking")}
              <span className="sr-only">{t("newTab")}</span>
              <Icon icon={ExternalLink} size="sm" />
            </a>
          )}
        </p>
        {transfer.notes === null ? null : (
          <p className="break-words text-sm text-text-muted">{transfer.notes}</p>
        )}
        {warnings.map((warning) => (
          <p key={warning} className="flex items-center gap-2 font-semibold text-error text-sm">
            <Icon icon={TriangleAlert} size="sm" />
            {warning}
          </p>
        ))}
      </div>
      <div className="flex shrink-0 gap-2">
        {join === undefined || transfer.charge !== "opt-in" ? null : (
          <JoinTransferToggle
            tripId={join.tripId}
            transferId={transfer.id}
            from={transfer.from}
            to={transfer.to}
            participantIds={transfer.participantIds}
            viewerId={join.viewerId}
            memberCount={join.memberCount}
          />
        )}
        <Button
          type="button"
          size="sm"
          variant="outline"
          icon={Pencil}
          labelHidden
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
          labelHidden
          aria-label={t("deleteLabel", { from: transfer.from, to: transfer.to })}
          onClick={() => hand("delete")}
        >
          {t("delete")}
        </Button>
      </div>
    </article>
  );
}
