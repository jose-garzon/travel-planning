"use client";

import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import type { Role } from "@/modules/trips/domain/trip";
import type { MemberDto } from "@/modules/trips/service/schemas";
import { MemberRow } from "@/modules/trips/ui/members/member-row";
import { ShareTripBox } from "@/modules/trips/ui/members/share-trip-box";
import { SectionHeader } from "@/shared/ui/components/section-header";

export type TravelersCardProps = {
  tripId: string;
  tripName: string;
  /** The signed-in member, so their own row offers Leave (feature 009 D-9). */
  viewerId: string;
  members: MemberDto[];
  /** The signed-in member's role on the trip. */
  role: Role;
  /** Opens the Invite card on load (the trip page's `?invite=1`, owners only). */
  openInvite?: boolean;
  /** The page shows the invite in its desktop rail; this card then leaves it out. */
  inviteInRail?: boolean;
};

/**
 * Travelers of a trip: the list, then (owners only) the invite call to
 * action. Same section header as budget and itinerary, so the crew reads
 * as its own stop on the page.
 */
export function TravelersCard({
  tripId,
  tripName,
  viewerId,
  members,
  role,
  openInvite = false,
  inviteInRail = false,
}: TravelersCardProps) {
  const t = useTranslations("trips.members");
  const [announcement, setAnnouncement] = useState("");
  const headingId = useId();
  const alone = members.length === 1 && role === "owner";

  return (
    <section id="crew" aria-labelledby={headingId} className="flex scroll-mt-6 flex-col gap-4">
      <SectionHeader
        id={headingId}
        title={t("title")}
        action={
          <span className="font-semibold text-text-muted tabular-nums">
            {t("count", { count: members.length })}
          </span>
        }
      />
      <ul className="flex flex-col">
        {members.map((member) => (
          <MemberRow
            key={member.userId}
            member={member}
            tripId={tripId}
            tripName={tripName}
            viewerId={viewerId}
            viewerRole={role}
            onRemoved={(name) => setAnnouncement(t("removed", { name }))}
          />
        ))}
      </ul>
      {/* Always mounted, so a removal is announced as it happens. */}
      <p role="status" className="sr-only">
        {announcement}
      </p>
      {/* Phones share from the ticket; the nudge stays here, one line. */}
      {role === "owner" && !inviteInRail ? (
        <ShareTripBox tripId={tripId} tripName={tripName} alone={alone} openInvite={openInvite} />
      ) : null}
    </section>
  );
}
