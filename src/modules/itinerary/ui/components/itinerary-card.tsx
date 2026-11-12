"use client";

import { Check, Ellipsis, ExternalLink, Plus, TriangleAlert } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import type { ActivityDto, ActivityInput } from "@/modules/itinerary/service/schemas";
import { ActivityForm } from "@/modules/itinerary/ui/components/activity-form";
import { useRouter } from "@/shared/i18n/navigation";
import { Button, buttonClasses } from "@/shared/ui/components/button";
import { ConfirmDialog } from "@/shared/ui/components/confirm-dialog";
import { Dialog } from "@/shared/ui/components/dialog";
import { Icon } from "@/shared/ui/components/icon";
import { cx } from "@/shared/ui/cx";
import { useIsOnline } from "@/shared/ui/hooks/use-is-online";
import { formatMoney } from "@/shared/ui/money";
import { withViewTransition } from "@/shared/ui/view-transition";

export type ItineraryStopProps = {
  tripId: string;
  /** Trip currency, for costs. */
  currency: string;
  /** This stop's activities, any order. */
  activities: ActivityDto[];
  /** The stop's days: what the day chips offer when adding. */
  startDate: string | null;
  endDate: string | null;
  /** userId → display name, for the participant list. */
  memberNames: Record<string, string>;
};

type Editing = { mode: "new" } | { mode: "edit"; activity: ActivityDto } | null;

function groupByDay(activities: ActivityDto[]): [string, ActivityDto[]][] {
  const days = new Map<string, ActivityDto[]>();
  for (const activity of activities) {
    days.set(activity.date, [...(days.get(activity.date) ?? []), activity]);
  }
  return [...days.entries()];
}

/**
 * One stop's suggested activities, by day, with its own add button.
 * Each member subscribes to what they will join; that choice drives
 * their budget.
 */
export function ItineraryStop({
  tripId,
  currency,
  activities,
  startDate,
  endDate,
  memberNames,
}: ItineraryStopProps) {
  const t = useTranslations("itinerary.activities");
  const locale = useLocale();
  const router = useRouter();
  const isOnline = useIsOnline();
  const [editing, setEditing] = useState<Editing>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  // Optimistic state: the card morphs at once, the server catches up.
  const [joined, setJoined] = useState<Record<string, boolean>>({});
  const [removed, setRemoved] = useState<ReadonlySet<string>>(new Set());

  // Drop overrides once the server's data agrees with them.
  useEffect(() => {
    setJoined((current) => {
      const next = Object.fromEntries(
        Object.entries(current).filter(([id, value]) =>
          activities.some((activity) => activity.id === id && activity.subscribed !== value),
        ),
      );
      return Object.keys(next).length === Object.keys(current).length ? current : next;
    });
  }, [activities]);

  const dateFormat = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  const weekdayFormat = new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" });

  async function errorMessage(response: Response | null): Promise<string> {
    const body = (await response?.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    return body?.error?.message ?? t("failed");
  }

  async function save(input: ActivityInput): Promise<string | null> {
    const url =
      editing?.mode === "edit"
        ? `/api/v1/trips/${tripId}/activities/${editing.activity.id}`
        : `/api/v1/trips/${tripId}/activities`;
    const response = await fetch(url, {
      method: editing?.mode === "edit" ? "PUT" : "POST",
      headers: { "content-type": "application/json", "accept-language": locale },
      body: JSON.stringify(input),
    }).catch(() => null);
    if (response?.ok) {
      setEditing(null);
      router.refresh();
      return null;
    }
    return errorMessage(response);
  }

  async function act(
    activityId: string,
    method: "PUT" | "DELETE",
    path: string,
    optimistic: { apply: () => void; revert: () => void },
  ) {
    if (busyId === activityId) {
      return;
    }
    setBusyId(activityId);
    setFailure(null);
    withViewTransition(optimistic.apply);
    const response = await fetch(`/api/v1/trips/${tripId}/activities/${activityId}${path}`, {
      method,
      headers: { "accept-language": locale },
    }).catch(() => null);
    setBusyId(null);
    if (response?.ok) {
      router.refresh();
    } else {
      const message = await errorMessage(response);
      withViewTransition(() => {
        optimistic.revert();
        setFailure(message);
      });
    }
  }

  function toggle(activity: ActivityDto) {
    const next = !(joined[activity.id] ?? activity.subscribed);
    void act(activity.id, next ? "PUT" : "DELETE", "/subscription", {
      apply: () => setJoined((current) => ({ ...current, [activity.id]: next })),
      revert: () =>
        setJoined((current) => {
          const { [activity.id]: _, ...rest } = current;
          return rest;
        }),
    });
  }

  function remove(activityId: string) {
    void act(activityId, "DELETE", "", {
      apply: () => setRemoved((current) => new Set(current).add(activityId)),
      revert: () =>
        setRemoved((current) => {
          const next = new Set(current);
          next.delete(activityId);
          return next;
        }),
    });
  }

  const days = groupByDay(
    activities
      .filter((activity) => !removed.has(activity.id))
      .map((activity) =>
        activity.id in joined
          ? { ...activity, subscribed: joined[activity.id] ?? activity.subscribed }
          : activity,
      )
      .sort(
        (a, b) =>
          a.date.localeCompare(b.date) || (a.startTime ?? "").localeCompare(b.startTime ?? ""),
      ),
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h4 className="font-bold font-display text-lg text-text-muted uppercase leading-none tracking-wide">
          {t("subheading")}
        </h4>
        <Dialog
          open={editing !== null}
          onOpenChange={(open) => setEditing(open ? (editing ?? { mode: "new" }) : null)}
          title={editing?.mode === "edit" ? t("editTitle") : t("add")}
          closeLabel={t("close")}
          trigger={
            <Button type="button" size="sm" variant="outline" icon={Plus} disabled={!isOnline}>
              {t("add")}
            </Button>
          }
        >
          {editing === null ? null : (
            <ActivityForm
              key={editing.mode === "edit" ? editing.activity.id : "new"}
              tripCurrency={currency}
              startDate={startDate}
              endDate={endDate}
              initial={editing.mode === "edit" ? editing.activity : undefined}
              onSubmit={save}
            />
          )}
        </Dialog>
      </div>
      {!isOnline ? <p className="text-text-muted">{t("offline")}</p> : null}
      {failure === null ? null : (
        <p role="alert" className="text-error">
          {failure}
        </p>
      )}
      {days.length === 0 ? (
        <p className="text-text-muted">{t("empty")}</p>
      ) : (
        <ol className="flex flex-col gap-7">
          {days.map(([day, activities]) => (
            <li key={day} className="flex flex-col gap-3">
              <h5 className="flex items-center gap-3">
                <span className="rounded-full bg-sun px-3 py-1 font-body font-semibold text-on-sun text-sm normal-case tracking-normal">
                  {dateFormat.format(new Date(`${day}T00:00:00Z`))}
                </span>
                <span className="font-bold font-display text-2xl uppercase leading-none tracking-wide">
                  {weekdayFormat.format(new Date(`${day}T00:00:00Z`))}
                </span>
              </h5>
              <ul className="flex flex-col gap-2">
                {activities.map((activity) => (
                  <ActivityRow
                    key={activity.id}
                    activity={activity}
                    currency={currency}
                    memberNames={memberNames}
                    isOnline={isOnline}
                    isBusy={busyId === activity.id}
                    onToggle={() => toggle(activity)}
                    onEdit={() => setEditing({ mode: "edit", activity })}
                    onDelete={() => remove(activity.id)}
                  />
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

type ActivityRowProps = {
  activity: ActivityDto;
  currency: string;
  memberNames: Record<string, string>;
  isOnline: boolean;
  isBusy: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

function ActivityRow({
  activity,
  currency,
  memberNames,
  isOnline,
  isBusy,
  onToggle,
  onEdit,
  onDelete,
}: ActivityRowProps) {
  const t = useTranslations("itinerary.activities");
  const locale = useLocale();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const going =
    activity.participantIds.length === 0
      ? t("nobody")
      : t("going", {
          names: activity.participantIds.map((id) => memberNames[id] ?? "?").join(", "),
        });
  return (
    <li
      className={cx(
        "morph-card flex flex-col gap-2 rounded-md bg-surface-1 p-4",
        activity.subscribed ? "border-2 border-secondary" : "border border-border-strong",
      )}
    >
      <div className="flex items-start gap-3">
        {/* Timetable: the departure time, set like a board. On phones it
            sits above the title; from sm up it becomes a column. */}
        <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:gap-4">
          <span className="shrink-0 pt-0.5 font-bold font-display text-xl leading-none tabular-nums tracking-wide sm:w-12">
            {activity.startTime ?? "—"}
          </span>
          <p className="min-w-0 font-semibold text-lg leading-snug">{activity.title}</p>
        </div>
        <div className="shrink-0">
          <Button
            type="button"
            size="sm"
            variant="outline"
            icon={Ellipsis}
            labelHidden
            aria-expanded={isMenuOpen}
            onClick={() => withViewTransition(() => setIsMenuOpen((open) => !open))}
          >
            {t("more", { title: activity.title })}
          </Button>
        </div>
      </div>
      <p className="sm:pl-16 text-sm text-text-muted">
        {activity.costPerPerson === null
          ? t("free")
          : t("perPerson", {
              amount: formatMoney(activity.costInTripCurrency, currency, locale),
            })}
        {activity.durationMinutes === null
          ? null
          : ` · ${
              activity.durationMinutes < 60
                ? t("minutes", { count: activity.durationMinutes })
                : t("hours", { count: Math.round(activity.durationMinutes / 30) / 2 })
            }`}
        {" · "}
        <span
          className={
            activity.participantIds.length === 0 ? undefined : "font-semibold text-secondary"
          }
        >
          {going}
        </span>
      </p>
      {activity.overlaps ? (
        <p className="flex items-center gap-2 sm:pl-16 font-semibold text-error text-sm">
          <Icon icon={TriangleAlert} />
          {t("overlap")}
        </p>
      ) : null}
      <div className="flex items-center gap-2 sm:pl-16">
        <button
          type="button"
          aria-busy={isBusy}
          disabled={!isOnline}
          onClick={onToggle}
          className={cx(
            "inline-flex min-h-touch items-center gap-1 rounded-full border-2 border-secondary px-3 font-semibold text-sm",
            "transition-colors duration-fast disabled:opacity-50",
            "ui-focus:outline-2 ui-focus:outline-focus ui-focus:outline-offset-2 ui-focus:outline-solid",
            activity.subscribed
              ? "bg-secondary text-on-secondary"
              : "text-secondary ui-hover:bg-secondary ui-hover:text-on-secondary",
          )}
        >
          {activity.subscribed ? <Icon icon={Check} size="sm" /> : null}
          {activity.subscribed ? t("joined") : t("join")}
        </button>
        {activity.link === null ? null : (
          <a
            href={activity.link}
            target="_blank"
            rel="noopener noreferrer"
            title={t("openLink")}
            className={cx(
              "shrink-0",
              buttonClasses({ variant: "outline", size: "sm", labelHidden: true }),
            )}
          >
            <Icon icon={ExternalLink} size="sm" />
            <span className="sr-only">{t("openLink")}</span>
          </a>
        )}
      </div>
      {isMenuOpen ? (
        <div className="flex gap-2 border-border border-t pt-3">
          <Button type="button" size="sm" variant="outline" disabled={!isOnline} onClick={onEdit}>
            {t("edit")}
          </Button>
          <ConfirmDialog
            title={t("deleteConfirm", { title: activity.title })}
            warning={t("deleteWarning")}
            confirmLabel={t("delete")}
            cancelLabel={t("cancel")}
            closeLabel={t("close")}
            onConfirm={onDelete}
            trigger={
              <Button type="button" size="sm" variant="outline" disabled={!isOnline}>
                {t("delete")}
              </Button>
            }
          />
        </div>
      ) : null}
    </li>
  );
}
