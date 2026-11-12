"use client";

import { ArrowRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { daysUntil, nextTransfer } from "@/modules/transfers/domain/next-transfer";
import type { TransferDto } from "@/modules/transfers/service/schemas";
import { formatTime } from "@/modules/transfers/ui/components/transfer-card";
import { Icon } from "@/shared/ui/components/icon";

export type NextTransferCardProps = {
  transfers: TransferDto[];
  /** The clock, epoch ms; passed in so the countdown is the server's. */
  now: number;
};

/**
 * "Next up" on top of the trip page: the first transfer still to come, with
 * a countdown, linking to its card. Nothing when none is left.
 */
export function NextTransferCard({ transfers, now }: NextTransferCardProps) {
  const t = useTranslations("transfers.next");
  const locale = useLocale();
  const next = nextTransfer(transfers, now);
  if (next === null) {
    return null;
  }
  return (
    <section
      aria-labelledby="next-transfer-heading"
      className="flex flex-col gap-1 rounded-md border-2 border-accent p-4"
    >
      <h2
        id="next-transfer-heading"
        className="font-bold font-display text-sm uppercase tracking-wide"
      >
        {t("heading")}
      </h2>
      <a
        href={`#transfer-${next.id}`}
        className="flex min-h-touch flex-wrap items-center gap-x-2 font-semibold underline-offset-4 hover:underline"
      >
        <span className="sr-only">{t("route", { from: next.from, to: next.to })}</span>
        <span aria-hidden="true">{next.from}</span>
        <Icon icon={ArrowRight} size="sm" />
        <span aria-hidden="true">{next.to}</span>
      </a>
      <p className="text-sm text-text-muted">
        {t("countdown", { days: daysUntil(next.departDate, now) })}
        {next.departTime === null
          ? null
          : ` · ${t("departs", { time: formatTime(next.departTime, locale) })}`}
      </p>
    </section>
  );
}
