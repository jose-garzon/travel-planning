"use client";

import { Plus, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Gap } from "@/modules/transfers/domain/gaps";
import type { TransferDto } from "@/modules/transfers/service/schemas";
import { TransferCard } from "@/modules/transfers/ui/components/transfer-card";
import { Button } from "@/shared/ui/components/button";
import { askAssistantForGap, openTransferSheet } from "@/shared/ui/transfer-events";

export type TransferGapProps = {
  gap: Gap;
  /** This gap's transfers, already in departure order. */
  transfers: TransferDto[];
  /** "Find options" needs the assistant; hidden when it is off. */
  hasAgent: boolean;
};

/**
 * The slot between two stops (or before the first, after the last): its
 * transfers by departure, or a dashed prompt with Add and Find options.
 */
export function TransferGap({ gap, transfers, hasAgent }: TransferGapProps) {
  const t = useTranslations("transfers.gap");
  const isReturn = gap.kind === "return";
  const place = isReturn
    ? t("labelReturn", { city: gap.from?.name ?? "" })
    : t("labelTo", { city: gap.to?.name ?? "" });

  const add = (
    <Button
      type="button"
      size="sm"
      variant="outline"
      icon={Plus}
      aria-label={t("addLabel", { place })}
      onClick={() => openTransferSheet({ gap: gap.index })}
    >
      {t("add")}
    </Button>
  );

  return (
    <section aria-label={place} className="flex flex-col gap-3">
      {transfers.length === 0 ? (
        <div className="flex flex-col gap-3 rounded-md border-2 border-border border-dashed p-4">
          <p className="font-semibold text-lg leading-snug">
            {isReturn
              ? t("askBack", { city: gap.to?.name ?? "" })
              : t("askTo", { city: gap.to?.name ?? "" })}
          </p>
          <div className="flex flex-wrap gap-2">
            {add}
            {hasAgent ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                icon={Sparkles}
                aria-label={t("findLabel", { place })}
                onClick={() =>
                  askAssistantForGap({
                    gap: gap.index,
                    from: gap.from?.name ?? null,
                    to: gap.to?.name ?? null,
                    date: gap.date,
                  })
                }
              >
                {t("findOptions")}
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <>
          <ul className="flex flex-col gap-2">
            {transfers.map((transfer) => (
              <li key={transfer.id}>
                <TransferCard transfer={transfer} />
              </li>
            ))}
          </ul>
          <div>{add}</div>
        </>
      )}
    </section>
  );
}
