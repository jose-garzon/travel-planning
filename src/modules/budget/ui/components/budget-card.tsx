"use client";

import { ChevronDown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import type { BudgetDto } from "@/modules/budget/service/schemas";
import { useRouter } from "@/shared/i18n/navigation";
import { Button } from "@/shared/ui/components/button";
import { Icon } from "@/shared/ui/components/icon";
import { Input } from "@/shared/ui/components/input";
import { SectionHeader } from "@/shared/ui/components/section-header";
import { cx } from "@/shared/ui/cx";
import { useIsOnline } from "@/shared/ui/hooks/use-is-online";
import { formatMoney } from "@/shared/ui/money";
import { BudgetHero } from "./budget-hero";

export type BudgetCardProps = {
  tripId: string;
  budget: BudgetDto;
  viewerId: string;
  /** userId → display name. */
  memberNames: Record<string, string>;
};

function field(form: FormData, name: string): string {
  return String(form.get(name) ?? "").trim();
}

/** "How much does this cost me?" first, then the trip total, cap, people and items. */
export function BudgetCard({ tripId, budget, viewerId, memberNames }: BudgetCardProps) {
  const t = useTranslations("budget.budget");
  const locale = useLocale();
  const router = useRouter();
  const isOnline = useIsOnline();
  const [error, setError] = useState<string | null>(null);
  const [capDraft, setCapDraft] = useState(
    budget.summary.cap === null ? "" : String(budget.summary.cap / 100),
  );
  const capValue = Number(capDraft);

  const money = (minor: number) => formatMoney(minor, budget.currency, locale);
  const { summary } = budget;

  async function send(path: string, method: string, body?: unknown): Promise<boolean> {
    setError(null);
    const response = await fetch(`/api/v1/trips/${tripId}/budget${path}`, {
      method,
      headers: { "content-type": "application/json", "accept-language": locale },
      body: body === undefined ? undefined : JSON.stringify(body),
    }).catch(() => null);
    if (response?.ok) {
      router.refresh();
      return true;
    }
    const payload = (await response?.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    setError(payload?.error?.message ?? t("failed"));
    return false;
  }

  async function saveCap(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = field(new FormData(event.currentTarget), "cap");
    await send("/cap", "PUT", { cap: value === "" ? null : Number(value) });
  }

  return (
    <section
      id="budget"
      aria-labelledby="budget-heading"
      className="flex scroll-mt-20 flex-col gap-4"
    >
      <SectionHeader id="budget-heading" title={t("heading")} />
      {!isOnline ? <p className="text-text-muted">{t("offline")}</p> : null}

      <BudgetHero budget={budget} />

      {/* The fare board: one row per traveler, like a station's departures. */}
      <section
        aria-labelledby="budget-per-person"
        className="overflow-hidden rounded-md border-2 border-text bg-surface-1"
      >
        <h3 id="budget-per-person" className="bg-text px-5 py-3 text-bg text-xl leading-none">
          {t("byPerson")}
        </h3>
        <ul className="flex flex-col divide-y-2 divide-dashed divide-border">
          {summary.perPerson.map((person) => {
            const isViewer = person.userId === viewerId;
            return (
              <li key={person.userId} className="flex items-baseline gap-3 px-5 py-3">
                <span
                  aria-hidden="true"
                  className={cx(
                    "size-3 shrink-0 self-center rounded-full border-2",
                    isViewer ? "border-secondary bg-secondary" : "border-text bg-surface-1",
                  )}
                />
                <span
                  className={cx(
                    "min-w-0 truncate font-bold font-display text-xl uppercase leading-none tracking-wide",
                    isViewer ? "text-secondary" : undefined,
                  )}
                >
                  {memberNames[person.userId] ?? "?"}
                  {isViewer ? <span className="sr-only">{` (${t("you")})`}</span> : null}
                </span>
                {isViewer ? (
                  <span
                    aria-hidden="true"
                    className="shrink-0 rounded-full bg-secondary px-2 py-0.5 font-semibold text-on-secondary text-xs"
                  >
                    {t("you")}
                  </span>
                ) : null}
                <span
                  aria-hidden="true"
                  className="min-w-4 flex-1 border-border-strong border-b-2 border-dotted"
                />
                <span className="shrink-0 font-bold font-display text-xl leading-none tabular-nums tracking-wide">
                  {money(person.total)}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <details className="group">
        <summary className="flex min-h-touch cursor-pointer list-none items-center gap-2 font-semibold ui-hover:text-accent [&::-webkit-details-marker]:hidden">
          <span className="inline-flex transition-transform duration-fast group-open:rotate-180">
            <Icon icon={ChevronDown} size="sm" />
          </span>
          {t("capToggle")}
        </summary>
        <form onSubmit={saveCap} className="mt-3 flex flex-wrap items-end gap-3">
          <Input
            name="cap"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            label={t("cap", { currency: budget.currency })}
            hint={
              capDraft !== "" && Number.isFinite(capValue) && capValue >= 0
                ? t("capPreview", { amount: money(Math.round(capValue * 100)) })
                : t("capHint")
            }
            value={capDraft}
            onChange={(event) => setCapDraft(event.target.value)}
          />
          <Button type="submit" variant="secondary" disabled={!isOnline}>
            {t("saveCap")}
          </Button>
        </form>
      </details>

      {error === null ? null : (
        <p role="alert" className="text-error">
          {error}
        </p>
      )}

      <p className="text-sm text-text-muted">{t("estimates")}</p>
    </section>
  );
}
