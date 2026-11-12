"use client";

import { Check, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "@/shared/i18n/navigation";
import { Button } from "@/shared/ui/components/button";
import { useIsOnline } from "@/shared/ui/hooks/use-is-online";

export type JoinTransferToggleProps = {
  tripId: string;
  transferId: string;
  from: string;
  to: string;
  participantIds: string[];
  viewerId: string;
  memberCount: number;
};

/**
 * Join / Joined for an opt-in transfer, with "n of m" travelers. The state
 * flips at once; the server catches up and the page refresh updates the
 * budget. A refusal puts it back and says why.
 */
export function JoinTransferToggle({
  tripId,
  transferId,
  from,
  to,
  participantIds,
  viewerId,
  memberCount,
}: JoinTransferToggleProps) {
  const t = useTranslations("transfers.card");
  const locale = useLocale();
  const router = useRouter();
  const isOnline = useIsOnline();
  // The viewer's choice until the server's data agrees with it.
  const [override, setOverride] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const serverJoined = participantIds.includes(viewerId);
  const joined = override ?? serverJoined;
  const others = participantIds.filter((id) => id !== viewerId).length;
  const count = others + (joined ? 1 : 0);

  async function toggle() {
    if (busy) {
      return;
    }
    const next = !joined;
    setBusy(true);
    setFailure(null);
    setOverride(next);
    const response = await fetch(`/api/v1/trips/${tripId}/transfers/${transferId}/participation`, {
      method: next ? "PUT" : "DELETE",
      headers: { "accept-language": locale },
    }).catch(() => null);
    setBusy(false);
    if (response?.ok) {
      router.refresh();
      return;
    }
    const body = (await response?.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    setOverride(null);
    setFailure(body?.error?.message ?? t("joinFailed"));
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <span className="text-sm text-text-muted tabular-nums">
          {t("participants", { count, total: memberCount })}
        </span>
        <Button
          type="button"
          size="sm"
          variant={joined ? "primary" : "outline"}
          icon={joined ? Check : Plus}
          aria-pressed={joined}
          aria-label={t("joinLabel", { from, to })}
          disabled={!isOnline}
          onClick={() => void toggle()}
        >
          {joined ? t("joined") : t("join")}
        </Button>
      </div>
      {failure === null ? null : (
        <p role="alert" className="text-error text-sm">
          {failure}
        </p>
      )}
    </div>
  );
}
