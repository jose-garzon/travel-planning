"use client";

import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import type { Role } from "@/modules/trips/domain/trip";
import type { MemberDto } from "@/modules/trips/service/schemas";
import { MemberRow } from "@/modules/trips/ui/members/member-row";

export type TravelersCardProps = {
  members: MemberDto[];
  /** The signed-in member's role on the trip. */
  role: Role;
};

/**
 * Travelers of a trip (feature 009 plan "Accessibility notes"): a card on
 * desktop; on mobile, a disclosure button with `aria-expanded` that shows
 * or hides the list. The list is in the DOM either way.
 */
export function TravelersCard({ members, role }: TravelersCardProps) {
  const t = useTranslations("trips.members");
  const [expanded, setExpanded] = useState(false);
  const headingId = useId();
  const listId = useId();
  const alone = members.length === 1 && role === "owner";

  return (
    <section
      aria-labelledby={headingId}
      className="mt-6 rounded-lg border border-border bg-surface-1 p-4"
    >
      <h2 id={headingId} className="hidden font-semibold lg:block">
        {t("title")}
      </h2>
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={listId}
        onClick={() => setExpanded((open) => !open)}
        className="flex w-full items-center justify-between font-semibold lg:hidden"
      >
        <span>{t("title")}</span>
        <span className="text-sm font-normal text-text-muted">
          {t("count", { count: members.length })}
        </span>
      </button>
      <ul id={listId} className={expanded ? "mt-2" : "hidden mt-2 lg:block"}>
        {members.map((member) => (
          <MemberRow key={member.userId} member={member} />
        ))}
      </ul>
      {alone ? <p className="mt-3 text-sm text-text-muted">{t("alone")}</p> : null}
      {role === "owner" ? (
        <button type="button" className="mt-3 font-semibold text-accent">
          {t("invite")}
        </button>
      ) : null}
    </section>
  );
}
