"use client";

import { TriangleAlert } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import type { ActivityDto, ActivityInput, ItineraryDto } from "@/modules/itinerary/service/schemas";
import { ActivityForm } from "@/modules/itinerary/ui/components/activity-form";
import { useRouter } from "@/shared/i18n/navigation";
import { Button } from "@/shared/ui/components/button";
import { Icon } from "@/shared/ui/components/icon";
import { useIsOnline } from "@/shared/ui/hooks/use-is-online";
import { formatMoney } from "@/shared/ui/money";

export type ItineraryCardProps = {
  tripId: string;
  itinerary: ItineraryDto;
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
 * The shared list of suggested activities, by day. Each member subscribes
 * to what they will join; that choice drives their budget.
 */
export function ItineraryCard({
  tripId,
  itinerary,
  startDate,
  endDate,
  memberNames,
}: ItineraryCardProps) {
  const t = useTranslations("itinerary.activities");
  const locale = useLocale();
  const router = useRouter();
  const isOnline = useIsOnline();
  const [editing, setEditing] = useState<Editing>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const dayFormat = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });

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

  const days = groupByDay(itinerary.activities);

  return (
    <section aria-labelledby="itinerary-heading" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="itinerary-heading" className="font-display text-3xl">
          {t("heading")}
        </h2>
        {editing === null ? (
          <Button type="button" disabled={!isOnline} onClick={() => setEditing({ mode: "new" })}>
            {t("add")}
          </Button>
        ) : null}
      </div>
      {!isOnline ? <p className="text-text-muted">{t("offline")}</p> : null}
      {failure === null ? null : (
        <p role="alert" className="text-error">
          {failure}
        </p>
      )}
      {editing !== null ? (
        <div className="rounded-md border-2 border-text bg-surface-1 p-4">
          <ActivityForm
            tripCurrency={itinerary.currency}
            startDate={startDate}
            endDate={endDate}
            initial={editing.mode === "edit" ? editing.activity : undefined}
            onSubmit={save}
            onCancel={() => setEditing(null)}
          />
        </div>
      ) : null}
      {days.length === 0 ? (
        <p className="text-text-muted">{t("empty")}</p>
      ) : (
        <ol className="flex flex-col gap-6">
          {days.map(([day, activities]) => (
            <li key={day} className="flex flex-col gap-3">
              <h3 className="font-semibold text-lg capitalize">
                {dayFormat.format(new Date(`${day}T00:00:00Z`))}
              </h3>
              <ul className="flex flex-col gap-3">
                {activities.map((activity) => (
                  <ActivityRow
                    key={activity.id}
                    activity={activity}
                    currency={itinerary.currency}
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
    </section>
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
  return (
    <li className="flex flex-col gap-2 rounded-md border border-border-strong bg-surface-1 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-semibold text-lg">
          {activity.startTime === null ? null : (
            <span className="mr-2 text-text-muted">{activity.startTime}</span>
          )}
          {activity.title}
        </span>
        {activity.costPerPerson === null ? (
          <span className="text-text-muted">{t("free")}</span>
        ) : (
          <span>
            {t("perPerson", {
              amount: formatMoney(activity.costInTripCurrency, currency, locale),
            })}
          </span>
        )}
      </div>
      {activity.durationMinutes === null ? null : (
        <span className="text-sm text-text-muted">
          {t("minutes", { count: activity.durationMinutes })}
        </span>
      )}
      {activity.overlaps ? (
        <p className="flex items-center gap-2 text-sm">
          <Icon icon={TriangleAlert} />
          {t("overlap")}
        </p>
      ) : null}
      {activity.link === null ? null : (
        <a
          href={activity.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm underline"
        >
          {t("openLink")}
        </a>
      )}
      <p className="text-sm text-text-muted">
        {activity.participantIds.length === 0
          ? t("nobody")
          : t("going", {
              names: activity.participantIds.map((id) => memberNames[id] ?? "?").join(", "),
            })}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={activity.subscribed ? "secondary" : "sun"}
          aria-pressed={activity.subscribed}
          disabled={!isOnline}
          isLoading={isBusy}
          onClick={onToggle}
        >
          {activity.subscribed ? t("leave") : t("join")}
        </Button>
        <Button type="button" variant="outline" disabled={!isOnline} onClick={onEdit}>
          {t("edit")}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!isOnline}
          onClick={() => {
            if (window.confirm(t("deleteConfirm", { title: activity.title }))) {
              onDelete();
            }
          }}
        >
          {t("delete")}
        </Button>
      </div>
    </li>
  );
}
