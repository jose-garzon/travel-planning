import { costInTripCurrency } from "@/modules/transfers/domain/transfer";
import type { TransfersRepository } from "@/modules/transfers/service/ports";

/** What the budget needs of a transfer. `cost` is per traveler, trip-currency minor units. */
export type TransferCostEntry = {
  id: string;
  gap: number;
  label: string;
  cost: number;
  charge: "all" | "opt-in";
  participantIds: string[];
};

/** Priced transfers of a trip, in one read (two queries). Unpriced ones cost nothing. */
export async function transferCosts(
  { tripId }: { tripId: string },
  { transfers }: { transfers: Pick<TransfersRepository, "listForTrip"> },
): Promise<TransferCostEntry[]> {
  const costs: TransferCostEntry[] = [];
  for (const transfer of await transfers.listForTrip(tripId)) {
    const cost = costInTripCurrency(transfer);
    if (cost !== null) {
      costs.push({
        id: transfer.id,
        gap: transfer.gap,
        label: `${transfer.from} → ${transfer.to}`,
        cost,
        charge: transfer.charge,
        participantIds: transfer.participantIds,
      });
    }
  }
  return costs;
}
