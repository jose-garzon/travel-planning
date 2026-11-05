"use client";

import { Ellipsis, Plus, TriangleAlert } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import type { ActivityDto, ActivityInput } from "@/modules/itinerary/service/schemas";
import { ActivityForm } from "@/modules/itinerary/ui/components/activity-form";
import { useRouter } from "@/shared/i18n/navigation";
import { Button } from "@/shared/ui/components/button";
import { ConfirmDialog } from "@/shared/ui/components/confirm-dialog";
import { Dialog } from "@/shared/ui/components/dialog";
import { Icon } from "@/shared/ui/components/icon";
import { cx } from "@/shared/ui/cx";
import { useIsOnline } from "@/shared/ui/hooks/use-is-online";
import { formatMoney } from "@/shared/ui/money";

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

  async function act(activityId: string, method: "PUT" | "DELETE", path: string) {
    setBusyId(activityId);
    setFailure(null);
    const response = await fetch(`/api/v1/trips/${tripId}/activities/${activityId}${path}`, {
      method,
      headers: { "accept-language": locale },
    }).catch(() => null);
    setBusyId(null);
    if (response?.ok) {
      router.refresh();
    } else {
      setFailure(await errorMessage(response));
    }
  }

  const days = groupByDay(
    [...activities].sort(
      (a, b) =>
        a.date.localeCompare(b.date) || (a.startTime ?? "").localeCompare(b.startTime ?? ""),
    ),
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-2xl leading-none">{t("subheading")}</h4>
        <Dialog
          open={editing !== null}
          onOpenChange={(open) => setEditing(open ? (editing ?? { mode: "new" }) : null)}
          title={editing?.mode === "edit" ? t("editTitle") : t("add")}
          closeLabel={t("close")}
          trigger={
            <Button type="button" icon={Plus} labelHidden disabled={!isOnline} title={t("add")}>
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
              <h3 className="flex items-center gap-3">
                <span className="rounded-full bg-sun px-3 py-1 font-body font-semibold text-on-sun text-sm normal-case tracking-normal">
                  {dateFormat.format(new Date(`${day}T00:00:00Z`))}
                </span>
                <span className="text-2xl leading-none">
                  {weekdayFormat.format(new Date(`${day}T00:00:00Z`))}
                </span>
              </h3>
              <ul className="flex flex-col gap-2">
                {activities.map((activity) => (
                  <ActivityRow
                    key={activity.id}
                    activity={activity}
                    currency={currency}
                    memberNames={memberNames}
                    isOnline={isOnline}
                    isBusy={busyId === activity.id}
                    onToggle={() =>
                      act(activity.id, activity.subscribed ? "DELETE" : "PUT", "/subscription")
                    }
                    onEdit={() => setEditing({ mode: "edit", activity })}
                    onDelete={() => act(activity.id, "DELETE", "")}
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
        "flex flex-col gap-2 rounded-md bg-surface-1 p-4",
        activity.subscribed ? "border-2 border-secondary" : "border border-border-strong",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        {activity.startTime === null ? (
          <span />
        ) : (
          <span className="rounded-full bg-sun px-3 py-1 font-semibold text-on-sun text-sm tabular-nums">
            {activity.startTime}
          </span>
        )}
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={activity.subscribed ? "outline" : "people"}
            aria-pressed={activity.subscribed}
            disabled={!isOnline}
            isLoading={isBusy}
            onClick={onToggle}
          >
            {activity.subscribed ? t("leave") : t("join")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            icon={Ellipsis}
            labelHidden
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            {t("more", { title: activity.title })}
          </Button>
        </div>
      </div>
      <p className="font-semibold text-lg leading-snug">{activity.title}</p>
      <p className="text-sm text-text-muted">
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
        {activity.link === null ? null : (
          <>
            {" · "}
            <a
              href={activity.link}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 ui-hover:text-accent"
            >
              {t("openLink")}
            </a>
          </>
        )}
      </p>
      {activity.overlaps ? (
        <p className="flex items-center gap-2 font-semibold text-error text-sm">
          <Icon icon={TriangleAlert} />
          {t("overlap")}
        </p>
      ) : null}
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
