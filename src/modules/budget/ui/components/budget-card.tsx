"use client";

import { useLocale, useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import { CATEGORIES, type Category } from "@/modules/budget/domain/budget";
import type { BudgetDto, BudgetItemInput } from "@/modules/budget/service/schemas";
import { useRouter } from "@/shared/i18n/navigation";
import { Button } from "@/shared/ui/components/button";
import { Input } from "@/shared/ui/components/input";
import { useIsOnline } from "@/shared/ui/hooks/use-is-online";
import { formatMoney } from "@/shared/ui/money";

export type BudgetCardProps = {
  tripId: string;
  budget: BudgetDto;
  viewerId: string;
  /** userId → display name. */
  memberNames: Record<string, string>;
};

const SELECT_CLASSES =
  "min-h-touch rounded-md border border-border-strong bg-surface-1 px-4 text-md text-text";

function field(form: FormData, name: string): string {
  return String(form.get(name) ?? "").trim();
}

/** "How much does this cost me?" first, then the trip total, cap, people and items. */
export function BudgetCard({ tripId, budget, viewerId, memberNames }: BudgetCardProps) {
  const t = useTranslations("budget.budget");
  const locale = useLocale();
  const router = useRouter();
  const isOnline = useIsOnline();
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currency, setCurrency] = useState(budget.currency);
  const [category, setCategory] = useState<Category>("lodging");

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

  async function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input: BudgetItemInput = {
      category,
      label: field(form, "label"),
      amount: Number(field(form, "amount") || "NaN"),
      currency: field(form, "currency").toUpperCase() || budget.currency,
      rate: field(form, "rate") || null,
      userId: category === "flights" ? field(form, "userId") || viewerId : null,
      link: field(form, "link") || null,
    };
    if (input.label === "" || Number.isNaN(input.amount)) {
      setError(t("required"));
      return;
    }
    setIsSaving(true);
    if (await send("/items", "POST", input)) {
      setIsAdding(false);
    }
    setIsSaving(false);
  }

  async function saveCap(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = field(new FormData(event.currentTarget), "cap");
    await send("/cap", "PUT", { cap: value === "" ? null : Number(value) });
  }

  return (
    <section aria-labelledby="budget-heading" className="flex flex-col gap-4">
      <h2 id="budget-heading" className="font-display text-3xl">
        {t("heading")}
      </h2>
      {!isOnline ? <p className="text-text-muted">{t("offline")}</p> : null}

      <div className="flex flex-col gap-1 rounded-md bg-sun p-4 text-on-sun">
        <span className="text-sm">{t("mine")}</span>
        <span className="font-display text-4xl">{money(budget.mine)}</span>
        <span className="text-sm">{t("total", { amount: money(summary.total) })}</span>
        {summary.remaining === null ? null : summary.remaining >= 0 ? (
          <span className="font-semibold text-sm">
            {t("remaining", { amount: money(summary.remaining) })}
          </span>
        ) : (
          <span role="status" className="font-semibold text-sm">
            {t("over", { amount: money(-summary.remaining) })}
          </span>
        )}
      </div>

      <details className="rounded-md border border-border-strong bg-surface-1 p-4">
        <summary className="cursor-pointer font-semibold">{t("byPerson")}</summary>
        <ul className="mt-3 flex flex-col gap-2">
          {summary.perPerson.map((person) => (
            <li key={person.userId} className="flex justify-between gap-3">
              <span className="truncate">
                {memberNames[person.userId] ?? "?"}
                {person.userId === viewerId ? ` (${t("you")})` : ""}
              </span>
              <span>{money(person.total)}</span>
            </li>
          ))}
        </ul>
      </details>

      <details className="rounded-md border border-border-strong bg-surface-1 p-4">
        <summary className="cursor-pointer font-semibold">{t("byCategory")}</summary>
        <ul className="mt-3 flex flex-col gap-2">
          {(Object.entries(summary.byCategory) as [string, number][]).map(([key, amount]) => (
            <li key={key} className="flex justify-between gap-3">
              <span>{t(`categories.${key}` as "categories.food")}</span>
              <span>{money(amount)}</span>
            </li>
          ))}
        </ul>
      </details>

      <form onSubmit={saveCap} className="flex flex-wrap items-end gap-3">
        <Input
          name="cap"
          type="number"
          min={0}
          step="0.01"
          inputMode="decimal"
          label={t("cap", { currency: budget.currency })}
          hint={t("capHint")}
          defaultValue={summary.cap === null ? undefined : summary.cap / 100}
        />
        <Button type="submit" variant="secondary" disabled={!isOnline}>
          {t("saveCap")}
        </Button>
      </form>

      {error === null ? null : (
        <p role="alert" className="text-error">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-lg">{t("items")}</h3>
        {isAdding ? null : (
          <Button type="button" disabled={!isOnline} onClick={() => setIsAdding(true)}>
            {t("add")}
          </Button>
        )}
      </div>

      {isAdding ? (
        <form
          onSubmit={addItem}
          noValidate
          className="flex flex-col gap-3 rounded-md border-2 border-text bg-surface-1 p-4"
        >
          <label className="flex flex-col gap-1">
            <span className="font-semibold text-sm">{t("category")}</span>
            <select
              className={SELECT_CLASSES}
              value={category}
              onChange={(event) => setCategory(event.target.value as Category)}
            >
              {CATEGORIES.map((key) => (
                <option key={key} value={key}>
                  {t(`categories.${key}`)}
                </option>
              ))}
            </select>
          </label>
          <p className="text-sm text-text-muted">{t(`splitHint.${category}`)}</p>
          {category === "flights" ? (
            <label className="flex flex-col gap-1">
              <span className="font-semibold text-sm">{t("forWhom")}</span>
              <select name="userId" defaultValue={viewerId} className={SELECT_CLASSES}>
                {Object.entries(memberNames).map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <Input name="label" label={t("label")} maxLength={80} required />
          <div className="grid grid-cols-2 gap-3">
            <Input
              name="amount"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              label={t("amount")}
              required
            />
            <Input
              name="currency"
              label={t("currency")}
              maxLength={3}
              value={currency}
              onChange={(event) => setCurrency(event.target.value.toUpperCase())}
            />
          </div>
          {currency !== budget.currency ? (
            <Input
              name="rate"
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              label={t("rate", { from: currency || "?", to: budget.currency })}
              hint={t("rateHint")}
            />
          ) : null}
          <Input name="link" type="url" label={t("link")} hint={t("optional")} />
          <div className="flex flex-wrap gap-3">
            <Button type="submit" isLoading={isSaving}>
              {t("save")}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setIsAdding(false)}>
              {t("cancel")}
            </Button>
          </div>
        </form>
      ) : null}

      {budget.items.length === 0 ? (
        <p className="text-text-muted">{t("empty")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {budget.items.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border-strong bg-surface-1 p-3"
            >
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-semibold">{item.label}</span>
                <span className="text-sm text-text-muted">
                  {t(`categories.${item.category}`)}
                  {item.userId === null
                    ? ` · ${t("splitEqually")}`
                    : ` · ${memberNames[item.userId] ?? "?"}`}
                  {item.currency === budget.currency
                    ? ""
                    : ` · ${formatMoney(item.amount, item.currency, locale)}`}
                </span>
              </span>
              <span className="flex items-center gap-2">
                <span>{money(item.amountInTripCurrency)}</span>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!isOnline}
                  onClick={() => {
                    if (window.confirm(t("deleteConfirm", { label: item.label }))) {
                      send(`/items/${item.id}`, "DELETE");
                    }
                  }}
                >
                  {t("delete")}
                </Button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="text-sm text-text-muted">{t("estimates")}</p>
    </section>
  );
}
