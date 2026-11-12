import type { ActivityCost, BudgetItem, TransferCost } from "@/modules/budget/domain/budget";

export type TripContext = { currency: string; memberIds: string[] };

export type TripContextReader = {
  get(tripId: string, userId: string): Promise<TripContext | null>;
};

/** Subscribed activity costs, from the itinerary module (wired by the app layer). */
export type ActivityCostsReader = { forTrip(tripId: string): Promise<ActivityCost[]> };

/** Priced transfers, from the transfers module (wired by the app layer). */
export type TransferCostsReader = { forTrip(tripId: string): Promise<TransferCost[]> };

export type BudgetRepository = {
  listItems(tripId: string): Promise<BudgetItem[]>;
  findItem(tripId: string, itemId: string): Promise<BudgetItem | null>;
  createItem(item: BudgetItem): Promise<void>;
  updateItem(item: BudgetItem): Promise<void>;
  removeItem(tripId: string, itemId: string): Promise<void>;
  getCap(tripId: string): Promise<number | null>;
  setCap(tripId: string, cap: number | null): Promise<void>;
};
