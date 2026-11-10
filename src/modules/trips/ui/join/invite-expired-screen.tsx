"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/navigation";
import { buttonClasses } from "@/shared/ui/components/button";
import { LineClosed } from "@/shared/ui/components/line-closed";

type InviteExpiredScreenProps = {
  /** The owner to name, when the page knows them (an expired, not reset, link). */
  ownerName?: string;
  /** Mid-join failures cannot name the owner (plan D-8): ask the trip owner. */
  askTripOwner?: boolean;
};

/** The link is expired, reset or unknown (feature 009 "States"). */
export function InviteExpiredScreen({ ownerName, askTripOwner = false }: InviteExpiredScreenProps) {
  const t = useTranslations("trips.join");

  function message(): string {
    if (ownerName !== undefined && ownerName !== "") {
      return t("expiredAsk", { owner: ownerName });
    }
    return askTripOwner ? t("expiredAskOwner") : t("invalid");
  }
  // No owner and not mid-join: the link was reset, mistyped or its trip is gone.
  const unknown = !askTripOwner && (ownerName === undefined || ownerName === "");

  return (
    <div className="flex flex-col items-start gap-4">
      <LineClosed className="mb-2" />
      <h1 className="font-display text-3xl font-bold leading-none">{message()}</h1>
      {unknown ? <p className="text-text-muted">{t("invalidHint")}</p> : null}
      <Link href="/" className={buttonClasses()}>
        {t("goHome")}
      </Link>
    </div>
  );
}
