"use client";

import { useLocale, useTranslations } from "next-intl";
import type { BudgetDto } from "@/modules/budget/service/schemas";
import { cx } from "@/shared/ui/cx";
import { formatMoney } from "@/shared/ui/money";

type BarProps = {
  /** 0..1 */
  fill: number;
  tone: "ink" | "error";
  thick?: boolean;
};

/** A horizontal bar; SVG so the fill is an attribute, not an inline style. */
function Bar({ fill, tone, thick = false }: BarProps) {
  const width = `${Math.round(Math.max(0, Math.min(1, fill)) * 1000) / 10}%`;
  return (
    <svg
      aria-hidden="true"
      className={cx("block w-full overflow-hidden rounded-full", thick ? "h-3" : "h-2")}
      preserveAspectRatio="none"
    >
      <rect width="100%" height="100%" className="fill-surface-2" />
      <rect
        width={width}
        height="100%"
        className={cx("meter-fill", tone === "error" ? "fill-error" : "fill-text")}
      />
    </svg>
  );
}

/** "How much does this cost me?" at a glance: my share, the total, the cap, where it goes. */
export function BudgetHero({ budget }: { budget: BudgetDto }) {
  const t = useTranslations("budget.budget");
  const locale = useLocale();
  const money = (minor: number) => formatMoney(minor, budget.currency, locale);
  const { summary } = budget;
  const isOver = summary.remaining !== null && summary.remaining < 0;
  // Biggest first; empty categories stay out of the bars.
  const rows = (Object.entries(summary.byCategory) as [string, number][])
    .filter(([, amount]) => amount > 0)
    .sort((left, right) => right[1] - left[1]);

  return (
    <div className="grid gap-8 rounded-md border-2 border-text bg-surface-1 p-5 md:grid-cols-2 md:gap-10 md:p-6">
      <div className="flex flex-col gap-2">
        <span className="font-semibold text-sm">{t("totalLabel")}</span>
        <span className="font-bold font-display text-4xl leading-none tabular-nums tracking-wide">
          {money(summary.total)}
        </span>
        <span className="text-text-muted">
          {t("mine")}: {money(budget.mine)}
        </span>
        {summary.cap === null || summary.remaining === null ? null : (
          <div className="mt-3 flex flex-col gap-2">
            <Bar
              fill={summary.cap === 0 ? 1 : summary.total / summary.cap}
              tone={isOver ? "error" : "ink"}
              thick
            />
            {isOver ? (
              <span role="status" className="font-semibold text-error text-sm">
                {t("over", { amount: money(-summary.remaining) })}
              </span>
            ) : (
              <span className="font-semibold text-sm">
                {t("remaining", { amount: money(summary.remaining) })}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-xl leading-none">{t("byCategory")}</h3>
        {rows.length === 0 ? (
          <p className="text-sm text-text-muted">{t("noSplitYet")}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {rows.map(([key, amount]) => (
              <li key={key} className="meter-row flex flex-col gap-1">
                <span className="flex justify-between gap-3 text-sm">
                  <span className="font-semibold">
                    {t(`categories.${key}` as "categories.food")}
                  </span>
                  <span className="tabular-nums">{money(amount)}</span>
                </span>
                <Bar fill={amount / summary.total} tone="ink" />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
