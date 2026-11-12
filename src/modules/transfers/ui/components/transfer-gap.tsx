"use client";

import { type LucideIcon, Plus, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Gap } from "@/modules/transfers/domain/gaps";
import type { TransferDto } from "@/modules/transfers/service/schemas";
import { TransferCard } from "@/modules/transfers/ui/components/transfer-card";
import { Icon } from "@/shared/ui/components/icon";
import { cx } from "@/shared/ui/cx";
import { askAssistantForGap, openTransferSheet } from "@/shared/ui/transfer-events";

export type TransferGapProps = {
  gap: Gap;
  /** This gap's transfers, already in departure order. */
  transfers: TransferDto[];
  /** "Find options" needs the assistant; hidden when it is off. */
  hasAgent: boolean;
  /** For joining opt-in transfers: the trip, the signed-in member and the crew size. */
  tripId: string;
  viewerId: string;
  memberCount: number;
};

/**
 * The slot between two stops (or before the first, after the last): its
 * transfers by departure on a solid stretch of line, or a dashed stretch
 * with one quiet question and Add / Find options.
 */
export function TransferGap({
  gap,
  transfers,
  hasAgent,
  tripId,
  viewerId,
  memberCount,
}: TransferGapProps) {
  const t = useTranslations("transfers.gap");
  const isReturn = gap.kind === "return";
  const place = isReturn
    ? t("labelReturn", { city: gap.from?.name ?? "" })
    : t("labelTo", { city: gap.to?.name ?? "" });

  const ask = isReturn
    ? t("askBack", { city: gap.to?.name ?? "" })
    : t("askTo", { city: gap.to?.name ?? "" });
  const empty = transfers.length === 0;

  return (
    // A stretch of the route between two stations: the rail lines up with
    // the station dots of the stop cards, so the line reads unbroken.
    <section aria-label={place} className="-my-4 flex">
      <span aria-hidden="true" className="ms-2 flex w-10 shrink-0 justify-center sm:w-12">
        <span
          className={cx("border-accent border-l-4", empty ? "border-dashed" : "border-solid")}
        />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1 py-3">
        {empty ? (
          // One line on every width. The question and Add are one button:
          // on mobile the whole question is the tap target (with a +), on
          // desktop only "+ Add" takes the pointer (`pointer-events` off on the
          // button, back on for that part), so the question stays plain text.
          <div className="flex items-center gap-x-2 sm:gap-x-3">
            <button
              type="button"
              aria-label={t("addLabel", { place })}
              onClick={() => openTransferSheet({ gap: gap.index })}
              className="group/add -mx-1 inline-flex min-h-touch min-w-0 cursor-pointer items-center gap-2 rounded-md px-1 text-start text-sm sm:pointer-events-none ui-focus:outline-2 ui-focus:outline-focus ui-focus:outline-solid sm:gap-3"
            >
              <span className="shrink-0 sm:hidden">
                <Icon icon={Plus} size="sm" />
              </span>
              <span className="min-w-0 font-semibold underline-offset-4 ui-hover:underline sm:font-normal sm:text-text-muted sm:ui-hover:no-underline">
                {ask}
              </span>
              <span className="pointer-events-auto hidden shrink-0 cursor-pointer items-center gap-1 font-semibold underline-offset-4 group-hover/add:text-accent-hover group-hover/add:underline sm:inline-flex">
                <Icon icon={Plus} size="sm" />
                {t("add")}
              </span>
            </button>
            {hasAgent ? (
              <GapAction
                icon={Sparkles}
                label={t("findOptions")}
                mobileLabel={null}
                name={t("findLabel", { place })}
                onClick={() =>
                  askAssistantForGap({
                    gap: gap.index,
                    from: gap.from?.name ?? null,
                    to: gap.to?.name ?? null,
                    date: gap.date,
                  })
                }
              />
            ) : null}
          </div>
        ) : (
          <>
            <ul className="flex flex-col">
              {transfers.map((transfer) => (
                <li key={transfer.id}>
                  <TransferCard transfer={transfer} join={{ tripId, viewerId, memberCount }} />
                </li>
              ))}
            </ul>
            <div>
              <GapAction
                icon={Plus}
                label={t("add")}
                name={t("addLabel", { place })}
                onClick={() => openTransferSheet({ gap: gap.index })}
              />
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/** A quiet text action on the line: full touch height, no pill to break the rhythm. */
function GapAction({
  icon,
  label,
  mobileLabel,
  name,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  /** Text below `sm`: a different label, or `null` for the icon alone. Omit to keep `label`. */
  mobileLabel?: string | null;
  name: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={name}
      onClick={onClick}
      className="-mx-1 inline-flex min-h-touch min-w-touch shrink-0 cursor-pointer justify-center items-center gap-1 rounded-full px-2 font-semibold text-sm underline-offset-4 ui-hover:text-accent-hover ui-hover:underline ui-focus:outline-2 ui-focus:outline-focus ui-focus:outline-solid"
    >
      <Icon icon={icon} size="sm" />
      {mobileLabel === undefined ? (
        label
      ) : (
        <>
          {mobileLabel === null ? null : <span className="sm:hidden">{mobileLabel}</span>}
          <span className="hidden sm:inline">{label}</span>
        </>
      )}
    </button>
  );
}
