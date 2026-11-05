"use client";

import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import type { Role } from "@/modules/trips/domain/trip";
import type { MemberDto } from "@/modules/trips/service/schemas";
import { InviteCard } from "@/modules/trips/ui/members/invite-card";
import { MemberRow } from "@/modules/trips/ui/members/member-row";

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
};

/**
 * Travelers of a trip (feature 009 plan "Accessibility notes"): a card on
 * desktop; on mobile, a disclosure button with `aria-expanded` that shows
 * or hides the list. The list is in the DOM either way.
 */
export function TravelersCard({
  tripId,
  tripName,
  viewerId,
  members,
  role,
  openInvite = false,
}: TravelersCardProps) {
  const t = useTranslations("trips.members");
  const [expanded, setExpanded] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const headingId = useId();
  const listId = useId();
  const alone = members.length === 1 && role === "owner";

  return (
    <section
      aria-labelledby={headingId}
      className="mt-6 rounded-lg border border-border bg-surface-1 p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id={headingId} className="hidden font-semibold lg:block">
          {t("title")}
        </h2>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={listId}
          onClick={() => setExpanded((open) => !open)}
          className="min-w-0 flex-1 text-left font-semibold lg:hidden"
        >
          {t("title")}
        </button>
        <span className="shrink-0 text-sm font-normal text-text-muted">
          {t("count", { count: members.length })}
        </span>
      </div>
      <ul id={listId} className={expanded ? "mt-2" : "hidden mt-2 lg:block"}>
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
      {alone ? <p className="mt-3 text-sm text-text-muted">{t("alone")}</p> : null}
      {role === "owner" ? (
        <div className="mt-3">
          <InviteCard
            tripId={tripId}
            tripName={tripName}
            defaultOpen={openInvite}
            trigger={
              <button type="button" className="font-semibold text-accent">
                {t("invite")}
              </button>
            }
          />
        </div>
      ) : null}
    </section>
  );
}
