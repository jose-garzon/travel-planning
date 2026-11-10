"use client";

import { useLocale, useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";
import type { InvitePreviewDto, JoinResultDto } from "@/modules/trips/service/schemas";
import { InviteExpiredScreen } from "@/modules/trips/ui/join/invite-expired-screen";
import { TripFullScreen } from "@/modules/trips/ui/join/trip-full-screen";
import { useRouter } from "@/shared/i18n/navigation";
import { Button } from "@/shared/ui/components/button";
import { useIsOnline } from "@/shared/ui/hooks/use-is-online";

export type JoinScreenProps = {
  token: string;
  preview: InvitePreviewDto;
  /** Signed-in visitors join; everyone else sees the `children` slot (the sign-in form). */
  signedIn: boolean;
  children?: ReactNode;
};

type Phase = "idle" | "joining" | "failed" | "expired" | "full";

/** "Nov 20 – Dec 3" or "20 nov – 3 dic", in the visitor's locale (EC-9); null when undated. */
function formatDates(start: string | null, end: string | null, locale: string): string | null {
  if (start === null || end === null) {
    return null;
  }
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).formatRange(new Date(`${start}T00:00:00Z`), new Date(`${end}T00:00:00Z`));
}

/** The preview of a trip and the Join action (feature 009 UC-2, UC-3). */
export function JoinScreen({ token, preview, signedIn, children }: JoinScreenProps) {
  const t = useTranslations("trips.join");
  const locale = useLocale();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const isOnline = useIsOnline();

  // A link that stops working while the visitor is here (EC-4) shows the expired page.
  if (phase === "expired") {
    return <InviteExpiredScreen askTripOwner />;
  }
  if (phase === "full") {
    return <TripFullScreen />;
  }

  async function join() {
    setPhase("joining");
    try {
      const response = await fetch(`/api/v1/invites/${token}/join`, { method: "POST" });
      if (response.ok) {
        const result = (await response.json()) as JoinResultDto;
        const toast = result.alreadyMember ? "already=1" : "joined=1";
        router.push(`/trips/${result.tripId}?${toast}`);
        return;
      }
      setPhase(response.status === 410 ? "expired" : response.status === 409 ? "full" : "failed");
    } catch {
      setPhase("failed");
    }
  }

  const dates = formatDates(preview.startDate, preview.endDate, locale);
  const joining = phase === "joining";

  return (
    <div className="flex flex-col gap-4">
      <p className="text-text-muted">{t("invitedBy", { owner: preview.ownerName })}</p>
      <h1 className="font-display text-3xl font-bold leading-none">{preview.tripName}</h1>
      {dates === null ? null : <p>{dates}</p>}
      <p>{t("travelers", { count: preview.memberCount })}</p>
      {signedIn ? (
        <Button type="button" disabled={joining || !isOnline} isLoading={joining} onClick={join}>
          {joining ? t("joining") : t("join")}
        </Button>
      ) : (
        children
      )}
      {signedIn && !isOnline ? <p className="text-sm text-text-muted">{t("offline")}</p> : null}
      {phase === "failed" ? <p role="alert">{t("failed")}</p> : null}
    </div>
  );
}
