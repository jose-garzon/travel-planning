"use client";

import { Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { InviteCard } from "@/modules/trips/ui/members/invite-card";
import { buttonClasses } from "@/shared/ui/components/button-classes";
import { Icon } from "@/shared/ui/components/icon";
import { cx } from "@/shared/ui/cx";
import { useIsDesktop } from "@/shared/ui/hooks/use-is-desktop";

type ShareProps = {
  tripId: string;
  tripName: string;
  /** Opens the invite on load (the trip page's `?invite=1`). */
  openInvite?: boolean;
};

/** Phones: one Share button on the ticket that opens the invite sheet. */
export function ShareTripButton({
  tripId,
  tripName,
  openInvite = false,
  className,
}: ShareProps & { className?: string }) {
  const t = useTranslations("trips.members");
  // One invite control per page: the rail box takes over from lg up.
  if (useIsDesktop()) {
    return null;
  }
  return (
    <span className={className}>
      <InviteCard
        tripId={tripId}
        tripName={tripName}
        defaultOpen={openInvite}
        trigger={
          <button
            type="button"
            aria-label={t("share")}
            title={t("share")}
            className={buttonClasses({ variant: "primary", labelHidden: true })}
          >
            <Icon icon={Share2} />
          </button>
        }
      />
    </span>
  );
}

export type ShareTripBoxProps = ShareProps & {
  /** Owners alone on the trip get the "plan together" nudge. */
  alone: boolean;
  /** Desktop rail only: renders nothing below lg (the ticket's Share takes over). */
  railOnly?: boolean;
  /** Phones only: renders nothing from lg up (the rail box takes over). */
  phoneOnly?: boolean;
  className?: string;
};

/**
 * A one-line invite strip, the crew colour on its edge: the desktop rail,
 * and on phones under the ticket while the owner is still alone.
 */
export function ShareTripBox({
  tripId,
  tripName,
  alone,
  openInvite = false,
  railOnly = false,
  phoneOnly = false,
  className,
}: ShareTripBoxProps) {
  const t = useTranslations("trips.members");
  const isDesktop = useIsDesktop();
  if ((railOnly && !isDesktop) || (phoneOnly && isDesktop)) {
    return null;
  }
  return (
    <div
      className={cx(
        "flex items-center gap-3 rounded-md border-2 border-secondary bg-surface-1 px-4 py-3",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm leading-snug">{alone ? t("alone") : t("inviteMore")}</p>
        <p className="text-text-muted text-xs">{t("shareHint")}</p>
      </div>
      <InviteCard
        tripId={tripId}
        tripName={tripName}
        defaultOpen={openInvite}
        trigger={
          <button
            type="button"
            aria-label={t("share")}
            title={t("share")}
            className={buttonClasses({ variant: "primary", labelHidden: true })}
          >
            <Icon icon={Share2} />
          </button>
        }
      />
    </div>
  );
}
