"use client";

import { useTranslations } from "next-intl";
import type { TransferDto } from "@/modules/transfers/service/schemas";
import { TransferCard } from "@/modules/transfers/ui/components/transfer-card";

export type RouteChangedGroupProps = {
  /** Transfers whose gap is no longer on the route. */
  transfers: TransferDto[];
  tripId: string;
  viewerId: string;
  memberCount: number;
};

/** Where transfers land when the route changed under them, so none disappears. */
export function RouteChangedGroup({
  transfers,
  tripId,
  viewerId,
  memberCount,
}: RouteChangedGroupProps) {
  const t = useTranslations("transfers.gap");
  if (transfers.length === 0) {
    return null;
  }
  return (
    <section aria-label={t("routeChangedGroup")} className="flex flex-col gap-1">
      <h3 className="font-semibold text-sm text-text-muted">{t("routeChangedGroup")}</h3>
      <ul className="flex flex-col">
        {transfers.map((transfer) => (
          <li key={transfer.id}>
            <TransferCard transfer={transfer} join={{ tripId, viewerId, memberCount }} />
          </li>
        ))}
      </ul>
    </section>
  );
}
