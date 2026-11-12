"use client";

import {
  BedDouble,
  Bus,
  ChevronDown,
  Ellipsis,
  ExternalLink,
  type LucideIcon,
  Plane,
  Plus,
  Trash2,
  Utensils,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import { CATEGORIES, type Category } from "@/modules/budget/domain/budget";
import type { BudgetDto, BudgetItemDto, BudgetItemInput } from "@/modules/budget/service/schemas";
import { useRouter } from "@/shared/i18n/navigation";
import { Button, buttonClasses } from "@/shared/ui/components/button";
import { ConfirmDialog } from "@/shared/ui/components/confirm-dialog";
import { Dialog } from "@/shared/ui/components/dialog";
import { Icon } from "@/shared/ui/components/icon";
import { Input } from "@/shared/ui/components/input";
import { useIsOnline } from "@/shared/ui/hooks/use-is-online";
import { formatMoney } from "@/shared/ui/money";
import { withViewTransition } from "@/shared/ui/view-transition";

const SELECT_CLASSES =
  "min-h-touch rounded-md border border-border-strong bg-surface-1 px-4 text-md text-text";

const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  flights: Plane,
  lodging: BedDouble,
  transport: Bus,
  food: Utensils,
  other: Ellipsis,
};

function field(form: FormData, name: string): string {
  return String(form.get(name) ?? "").trim();
}

export type BudgetCostsProps = {
  tripId: string;
  budget: BudgetDto;
  viewerId: string;
  /** userId → display name. */
  memberNames: Record<string, string>;
  /** This stop's costs. */
  items: BudgetItemDto[];
  /** Leg position new costs belong to; null: the whole trip. */
  stop: number | null;
};

/** One stop's costs, with its own add button; new costs land in this stop. */
export function BudgetCosts({
  tripId,
  budget,
  viewerId,
  memberNames,
  items,
  stop,
}: BudgetCostsProps) {
  const t = useTranslations("budget.budget");
  const locale = useLocale();
  const router = useRouter();
  const isOnline = useIsOnline();
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  // Optimistic delete: the cost folds away at once, neighbours close the gap.
  const [removed, setRemoved] = useState<ReadonlySet<string>>(new Set());
  const visible = items.filter((item) => !removed.has(item.id));

  async function removeItem(itemId: string) {
    withViewTransition(() => setRemoved((current) => new Set(current).add(itemId)));
    if (!(await send(`/items/${itemId}`, "DELETE"))) {
      withViewTransition(() =>
        setRemoved((current) => {
          const next = new Set(current);
          next.delete(itemId);
          return next;
        }),
      );
    }
  }
  const [currency, setCurrency] = useState(budget.currency);
  const [category, setCategory] = useState<Category>(stop === null ? "flights" : "lodging");

  const money = (minor: number) => formatMoney(minor, budget.currency, locale);

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
      stop,
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h4 className="font-bold font-display text-lg text-text-muted uppercase leading-none tracking-wide">
          {t("items")}
        </h4>
        <Dialog
          open={isAdding}
          onOpenChange={setIsAdding}
          title={t("add")}
          closeLabel={t("close")}
          trigger={
            <Button type="button" size="sm" variant="outline" icon={Plus} disabled={!isOnline}>
              {t("add")}
            </Button>
          }
        >
          <form onSubmit={addItem} noValidate className="flex flex-col gap-5">
            <fieldset>
              <legend className="mb-2 font-semibold text-sm">{t("category")}</legend>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map((key) => (
                  <label key={key} className="day-chip min-w-0">
                    <input
                      type="radio"
                      name="category"
                      value={key}
                      checked={category === key}
                      onChange={() => setCategory(key)}
                      className="sr-only"
                    />
                    <Icon icon={CATEGORY_ICONS[key]} />
                    <span className="font-semibold text-sm">{t(`categories.${key}`)}</span>
                  </label>
                ))}
              </div>
              <p className="mt-2 text-sm text-text-muted">{t(`splitHint.${category}`)}</p>
            </fieldset>
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
            <div className="grid grid-cols-amount gap-3">
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
            <details className="group">
              <summary className="flex min-h-touch cursor-pointer list-none items-center gap-2 font-semibold">
                <span className="inline-flex transition-transform duration-fast group-open:rotate-180">
                  <Icon icon={ChevronDown} size="sm" />
                </span>
                {t("moreDetails")}
              </summary>
              <div className="mt-3">
                <Input name="link" type="url" label={t("link")} />
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
        </Dialog>
      </div>

      {visible.length === 0 ? (
        <p className="text-text-muted">{t("empty")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {visible.map((item) => (
            <li
              key={item.id}
              className="morph-card flex flex-col gap-2 rounded-md border border-border-strong bg-surface-1 p-4"
            >
              <span className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate font-semibold">{item.label}</span>
                <span className="shrink-0 font-bold tabular-nums">
                  {money(item.amountInTripCurrency)}
                </span>
              </span>
              <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="text-sm text-text-muted">
                  {t(`categories.${item.category}`)}
                  {item.userId === null
                    ? ` · ${t("splitEqually")}`
                    : ` · ${memberNames[item.userId] ?? "?"}`}
                  {item.currency === budget.currency
                    ? ""
                    : ` · ${formatMoney(item.amount, item.currency, locale)}`}
                </span>
                <span className="ml-auto flex shrink-0 items-center gap-2">
                  {item.link === null ? null : (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={t("openLink", { label: item.label })}
                      className={buttonClasses({
                        variant: "outline",
                        size: "sm",
                        labelHidden: true,
                      })}
                    >
                      <Icon icon={ExternalLink} size="sm" />
                      <span className="sr-only">{t("openLink", { label: item.label })}</span>
                    </a>
                  )}
                  <ConfirmDialog
                    title={t("deleteConfirm", { label: item.label })}
                    warning={t("deleteWarning")}
                    confirmLabel={t("delete")}
                    cancelLabel={t("cancel")}
                    closeLabel={t("close")}
                    onConfirm={() => removeItem(item.id)}
                    trigger={
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        icon={Trash2}
                        labelHidden
                        disabled={!isOnline}
                      >
                        {t("deleteItem", { label: item.label })}
                      </Button>
                    }
                  />
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
      {error === null || isAdding ? null : (
        <p role="alert" className="text-error">
          {error}
        </p>
      )}
    </div>
  );
}
