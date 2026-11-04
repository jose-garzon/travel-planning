"use client";

import { useTranslations } from "next-intl";
import type { MemberDto } from "@/modules/trips/service/schemas";

/** One traveler: the full name (truncated by CSS, never shortened in the DOM) and the role badge. */
export function MemberRow({ member }: { member: MemberDto }) {
  const t = useTranslations("trips.members");

  return (
    <li className="flex items-center justify-between gap-3 py-2">
      <span className="min-w-0 truncate font-medium">{member.name}</span>
      <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-xs text-text-muted">
        {t(member.role)}
      </span>
    </li>
  );
}
